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
import uuid from 'uuid/v1';

let HostURL;
let ipnURL;
if (process.env.NODE_ENV !== 'production') {
    HostURL = 'http://localhost:3007';
    try {
        ipnURL = await ngrok.connect({
            proto: 'https',
            addr: 3007,
            authtoken: process.env.NGROK_AUTH_TOKEN,
            region: 'ap',
        });
        console.log(`Ngrok IPN URL: ${ipnURL}`);
    } catch (err) {
        console.error('Lỗi kết nối ngrok:', err);
    } // URL free, thay đổi liên tục mỗi lần chạy nên cần thay mỗi lần chạy local
}

// demo config zalopay
const zalopayConfig = {
    appid: "553",
    key1: "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q",
    key2: "Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3",
    endpoint: "https://sbgateway.zalopay.vn/api/getlistmerchantbanks"
};

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

            return res.status(201).json(response.data.payUrl);
        }

        if (method === 'zalopay') {
            const embeddata = {
                redirectUrl: `${HostURL}/payment-result`, // URL trả về sau khi thanh toán thành công
            };
              
            const order = {
                appid: zalopayConfig.appid, 
                apptransid: `${moment().format('YYMMDD')}_${uuid()}`, // mã giao dich có định dạng yyMMdd_xxxx
                appuser: "demo", 
                apptime: Date.now(), // miliseconds
                item: JSON.stringify(selectedTicketsArray), 
                embeddata: JSON.stringify(embeddata), 
                amount: parseInt(finalprice), 
                description: "ZaloPay Integration Demo",
                bankcode: "zalopayapp",
                callback_url: `${ipnURL}/api/v1/payment-status`, // URL callback
            };
              
            // appid|apptransid|appuser|amount|apptime|embeddata|item
            const data = zalopayConfig.appid + "|" + order.apptransid + "|" + order.appuser + "|" + order.amount + "|" + order.apptime + "|" + order.embeddata + "|" + order.item;
            order.mac = CryptoJS.HmacSHA256(data, zalopayConfig.key1).toString();
              
            axios.post(zalopayConfig.endpoint, null, { params: order })
            .then(response => {
                console.log(response.data);
                return res.status(201).json(response.data.orderurl);
            })
            .catch(err => console.log(err));
        }
    } catch (error) {
        await session.abortTransaction();
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

                redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                    console.log('Deleted key',reply);
                });

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
        res.render('payment-failure');
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
            let extraData = req.body.data;
            let reqMac = req.body.mac;
            let mac = CryptoJS.HmacSHA256(extraData, zalopayConfig.key2).toString();
            // Kiểm tra callback hợp lệ
            if (reqMac !== mac) {
                resultCode = -1;
                return res.status(400).json({ success: false, message: "Callback không hợp lệ" });
            }

            const decodedExtraData = Buffer.from(extraData, 'base64').toString('utf-8');
            console.log('decodedExtraData:', decodedExtraData);
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

                redisClient.client.del([callbackDetail.transactionId], (err, reply) => {
                    if (err) {
                        console.log(err.message);
                    }
                    console.log('Deleted key',reply);
                });

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