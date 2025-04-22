import axios from 'axios';
import orderModel from '../models/order.model.js';
import ticketTypeModel from '../models/ticket_type.model.js';
import ticketModel from '../models/ticket.model.js';
import CustomerModel from '../models/customer.model.js';
import redisClient from '../dbs/connectRedis.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import ngrok from 'ngrok';
import CryptoJS from 'crypto-js';
import moment from 'moment';

let HostURL;
let ipnURL;
if (process.env.NODE_ENV !== 'pro') {
    HostURL = `http://localhost:${process.env.PORT}`;
    try {
        ipnURL = await ngrok.connect({
            proto: 'http',
            addr: parseInt(process.env.PORT,10),
            authtoken: process.env.NGROK_AUTH_TOKEN,
            region: 'ap',
        }); 
        console.log(`Ngrok IPN URL: ${ipnURL}`);
    } catch (err) {
        console.error('Lỗi kết nối ngrok:', err);
    } // URL free, thay đổi liên tục mỗi lần chạy nên cần thay mỗi lần chạy local
} else {
    HostURL = `https://ticket-box-eta.vercel.app`;
    ipnURL = `https://ticket-box-eta.vercel.app`;
}

// demo config zalopay
const zalopayConfig = {
    app_id: "2554",
    key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

let transactionid = null;

const createPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { method, totalprice, selectedTicketsArray, customerID, finalprice } = req.body.momoDetail || req.body.zalopayDetail;
        extraData = req.body.momoDetail || req.body.zalopayDetail;
        // Bước 1: Trừ vé 
        for (const ticket of selectedTicketsArray) {
            const updatedTicket = await ticketTypeModel.findOneAndUpdate(
            { ticketTypeID: ticket.ticketTypeID, quantity: { $gte: ticket.quantity } }, 
            { $inc: { quantity: -ticket.quantity } }, 
            { session, new: true }
            );
            if (!updatedTicket) {
                throw new Error(`Không tìm thấy vé "${ticket.ticketTypeID} hoặc số lượng vé còn lại không đủ.`);
            }
        }

        // Bước 2: Lưu vào Redis với expiry time 15 phút
        const transactionId = `transaction:${customerID}:${Date.now()}`;
        transactionid = transactionId;
        extraData = { ...extraData, transactionId };
        const extraDataString = JSON.stringify(extraData);
        const encodedExtraData = Buffer.from(extraDataString).toString('base64');

        const redisSet = await redisClient.client.setEx(transactionId, 900, JSON.stringify({
            customerID, 
            selectedTicketsArray, 
            finalprice
        }));

        if (!redisSet) {
            throw new Error("Lỗi lưu giao dịch vào Redis.");
        }
        // Nếu tất cả thành công, commit transaction
        await session.commitTransaction();

        // Bước 3: Kết nối api thanh toán
        if (method === 'momo') {
            var partnerCode = "MOMO";
            var accessKey = "F8BBA842ECF85";
            var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = "Thanh toan tien ve"; // Nội dung giao dịch
            var redirectUrl = `${HostURL}/payment-result`; // url trả về sau khi thanh toán
            var ipnUrl = `${ipnURL}/api/v1/payment-status`; // url callback
            // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = finalprice; // giá tiền thanh toán
            var requestType = "captureWallet"
            var extraData = encodedExtraData; //pass empty value if your merchant does not have stores

            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            var rawSignature = "accessKey="+accessKey+"&amount=" + amount+"&extraData=" + extraData+"&ipnUrl=" + ipnUrl+"&orderId=" + orderId+"&orderInfo=" + orderInfo+"&partnerCode=" + partnerCode +"&redirectUrl=" + redirectUrl+"&requestId=" + requestId+"&requestType=" + requestType
            //signature
            var signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode : partnerCode,
                accessKey : accessKey,
                requestId : requestId,
                amount : amount,
                orderId : orderId,
                orderInfo : orderInfo,
                redirectUrl : redirectUrl,
                ipnUrl : ipnUrl,
                extraData : extraData,
                requestType : requestType,
                signature : signature,
                lang: 'en',
            });

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return res.status(201).json({url: response.data.payUrl, success: true});
        }

        if (method === 'zalopay') {
            const embeddata = {
                redirecturl: `${HostURL}/payment-result`, // URL trả về sau khi thanh toán thành công
            };

            let mergeddata = {...embeddata, ...extraData};
            const transID = Math.floor(Math.random() * 1000000);
            const order = {
                app_id: zalopayConfig.app_id, 
                app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // mã giao dich có định dạng yyMMdd_xxxx
                app_user: "user123", 
                app_time: Date.now(), // miliseconds
                item: JSON.stringify(selectedTicketsArray), // thông tin vé đã chọn
                embed_data: JSON.stringify(mergeddata), 
                amount: parseInt(finalprice,10), 
                description: "ZaloPay Integration Demo",
                bank_code: "",
                callback_url: `${ipnURL}/api/v1/payment-status-zalopay`, // URL callback
            };
              
            // appid|apptransid|appuser|amount|apptime|embeddata|item
            const data = zalopayConfig.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
            order.mac = CryptoJS.HmacSHA256(data, zalopayConfig.key1).toString();

            axios.post(zalopayConfig.endpoint, null, { params: order })
            .then(async (response) => {
                if (response.data.return_code !== 1) {
                    throw new Error('Lỗi tạo đơn hàng Zalopay: ' + response.data.return_message + ' - ' + 'Code: ' + response.data.sub_return_code + ' - ' + response.data.sub_return_message);
                }
                return res.status(201).json({url: response.data.order_url, success: true});
            })
            .catch(err => console.log(err));
        }
    } catch (error) {
        await session.abortTransaction();
        await redisClient.client.del([transactionid]);
        
        await redisClient.client.hDel("pending_transactions", transactionid);
        console.log(error.message)
        res.status(400).json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
}

const getPaymentStatus = async (req, res, next) => {
    let session;
    const MAX_RETRIES = 3; // Số lần thử lại tối đa
    const RETRY_DELAY = 1000; // Thời gian chờ giữa các lần thử lại (ms)
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const { resultCode, extraData } = req.body;

            const decodedExtraData = Buffer.from(extraData, 'base64').toString('utf-8');
            const callbackDetail = JSON.parse(decodedExtraData);
            if (resultCode === 0) {
                session = await mongoose.startSession();
                session.startTransaction();

                // Lấy thông tin khách hàng từ database
                const _customer = await CustomerModel.findById(callbackDetail.customerID).session(session);
                if (!_customer) {
                    throw new Error('Không tìm thấy thông tin khách hàng');
                }

                // Tạo danh sách vé từ selectedTickets
                const selectedTicketsArrayFlatMap = callbackDetail.selectedTicketsArray.flatMap(ticket => {
                    return Array(ticket.quantity).fill(ticket.ticketTypeID);
                });

                // Tạo các vé trong database
                const createTickets = await Promise.all(selectedTicketsArrayFlatMap.map(async (ticket) => {
                    const createTicket = await ticketModel.create([{
                        status: 'Sold',
                        customerFullname: _customer.fullName || '',
                        customerEmail: _customer.email || '',
                        customerPhone: _customer.phone || '',
                        TicketTypeID: ticket,
                    }], { session });
                    return createTicket[0]._id;
                }));

                const voucherID = callbackDetail.voucherID ? mongoose.Types.ObjectId(callbackDetail.voucherID) : null;
                // Tạo đơn hàng trong database
                const createOrder = await orderModel.create([{
                    customerID: callbackDetail.customerID,
                    orderDetails: createTickets,
                    voucherID: voucherID,
                    subTotal: callbackDetail.finalprice,
                    totalPrice: parseInt(callbackDetail.totalprice,10),
                    discountAmount: callbackDetail.discount,
                    'payment.methodPayment': callbackDetail.method,
                    'payment.datePayment': new Date(),
                }], { session });

                console.log('createOrder:', createOrder);

                await redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                    console.log('Deleted key',reply);
                });

                await redisClient.client.hDel("pending_transactions", callbackDetail.transactionId);

                await session.commitTransaction();
                await session.endSession();
                session = null;

                return res.status(200).json({ success: true, message: "Thanh toán thành công" });
            } else {
                session = await mongoose.startSession();
                session.startTransaction();
                for (const ticket of callbackDetail.selectedTicketsArray) {
                    await ticketTypeModel.updateOne(
                        { ticketTypeID: ticket.ticketTypeID },
                        { $inc: { quantity: ticket.quantity } }
                    );
                }

                await redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                });
                await redisClient.client.hDel("pending_transactions", callbackDetail.transactionId);

                await session.commitTransaction();
                await session.endSession();
                session = null;
                return res.status(400).json({ success: false, message: "Thanh toán không thành công" });
            }
        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }

            console.error(`Lỗi lần ${retries + 1}:`, error.message);

            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Thử lại sau ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error('Đã thử lại tối đa số lần.');
                return res.status(500).json({ success: false, message: "Cập nhật dữ liệu thất bại" });
            }
        }
    }
};

const getPaymentResult = async (req, res, next) => {
    const { resultCode } = req.query;

    if (resultCode === '0') {
        res.render('payment-success');
    } else {
        if (resultCode === undefined) {
            const { status } = req.query;
            if (status === '1') {
                res.render('payment-success');
            }
        } else {
            res.render('payment-failure');
        }
    }
}

const getPaymentStatusZaloPay = async (req, res, next) => {
    let session;
    const MAX_RETRIES = 3; // Số lần thử lại tối đa
    const RETRY_DELAY = 1000; // Thời gian chờ giữa các lần thử lại (ms)
    let retries = 0;
    let resultCode = 0;

    while (retries < MAX_RETRIES) {
        try {
            let dataStr = req.body.data;
            console.log('dataStr:', dataStr);
            let reqMac = req.body.mac;
            console.log('reqMac', reqMac);
            let mac = CryptoJS.HmacSHA256(dataStr, zalopayConfig.key2).toString();
            console.log('mac:', mac);
            // Kiểm tra callback hợp lệ
            if (reqMac !== mac) {
                resultCode = -1;
                throw new Error('Lỗi xác thực callback từ Zalopay');
            }

            // const decodedExtraData = Buffer.from(extraData, 'base64').toString('utf-8');
            // console.log('decodedExtraData:', decodedExtraData);
            const dataJSON = JSON.parse(dataStr);
            const extraData = dataJSON.embed_data;
            console.log('extraData:', extraData);
            const callbackDetail = JSON.parse(extraData);
            if (resultCode === 0) {
                session = await mongoose.startSession();
                session.startTransaction();

                // Lấy thông tin khách hàng từ database
                const _customer = await CustomerModel.findById(callbackDetail.customerID).session(session);
                if (!_customer) {
                    throw new Error('Không tìm thấy thông tin khách hàng');
                }

                // Tạo danh sách vé từ selectedTickets
                const selectedTicketsArrayFlatMap = callbackDetail.selectedTicketsArray.flatMap(ticket => {
                    return Array(ticket.quantity).fill(ticket.ticketTypeID);
                });

                // Tạo các vé trong database
                const createTickets = await Promise.all(selectedTicketsArrayFlatMap.map(async (ticket) => {
                    const createTicket = await ticketModel.create([{
                        status: 'Sold',
                        customerFullname: _customer.fullName || '',
                        customerEmail: _customer.email || '',
                        customerPhone: _customer.phone || '',
                        TicketTypeID: ticket,
                    }], { session });
                    return createTicket[0]._id;
                }));

                const voucherID = callbackDetail.voucherID ? mongoose.Types.ObjectId(callbackDetail.voucherID) : null;
                // Tạo đơn hàng trong database
                const createOrder = await orderModel.create([{
                    customerID: callbackDetail.customerID,
                    orderDetails: createTickets,
                    voucherID: voucherID,
                    subTotal: callbackDetail.finalprice,
                    totalPrice: parseInt(callbackDetail.totalprice,10),
                    discountAmount: callbackDetail.discount,
                    'payment.methodPayment': callbackDetail.method,
                    'payment.datePayment': new Date(),
                }], { session });

                await redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                    console.log('Deleted key',reply);
                });
                
                await redisClient.client.hDel("pending_transactions", callbackDetail.transactionId);

                await session.commitTransaction();
                await session.endSession();
                session = null;

                return res.status(200).json({ success: true, message: "Thanh toán thành công" });
            } else {
                session = await mongoose.startSession();
                session.startTransaction();
                for (const ticket of callbackDetail.selectedTicketsArray) {
                    await ticketTypeModel.updateOne(
                        { ticketTypeID: ticket.ticketTypeID },
                        { $inc: { quantity: ticket.quantity } }
                    );
                }

                redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                });
                await redisClient.client.hDel("pending_transactions", callbackDetail.transactionId);

                await session.commitTransaction();
                await session.endSession();
                session = null;
                return res.status(400).json({ success: false, message: "Thanh toán không thành công" });
            }
        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }

            console.error(`Lỗi lần ${retries + 1}:`, error.message);

            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Thử lại sau ${RETRY_DELAY}ms`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error('Đã thử lại tối đa số lần.');
                return res.status(500).json({ success: false, message: "Cập nhật dữ liệu thất bại" });
            }
        }
    }
}

const PaymentController = {
    createPayment,
    getPaymentStatus,
    getPaymentResult,
    getPaymentStatusZaloPay,
}

export default PaymentController;