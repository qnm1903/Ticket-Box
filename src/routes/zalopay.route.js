
import express from 'express';
import router from 'express';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import qs from 'qs';
// Info:
/*
Số thẻ	4111111111111111
Tên	NGUYEN VAN A
Ngày hết hạn	01/25
Mã CVV	123
 */
const config = {
    app_id: "2554",
    key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
    endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

// Route xử lý thanh toán ZaloPay
router.post('/payment', async (req, res) => {
    const {order_id, name, email, phone, totalAmount} = req.body
    req.session.info = {
        order_id,
        name,
        email,
        phone,
        totalAmount
    }
    console.log(req.session.info)
    const embed_data = {
        //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
        redirecturl: `https://dec6-113-161-238-218.ngrok-free.app/thank-you?order_id=${order_id}&name=${name}&phone=${phone}&email=${email}&totalAmount=${totalAmount}`,
    };
    // item thông tin
    const items = [];
    const transID = Math.floor(Math.random() * 1000000);

    const order = {
        app_id: config.app_id,
        app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
        app_user: 'user123',
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: totalAmount || 50000 ,
        //khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
        //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
        description: `Lazada - Payment for the order #${transID}`,
        bank_code: '',
        // callback_url: " https://355e-113-161-238-218.ngrok-free.app/callback"
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data =
        config.app_id +
        '|' +
        order.app_trans_id +
        '|' +
        order.app_user +
        '|' +
        order.amount +
        '|' +
        order.app_time +
        '|' +
        order.embed_data +
        '|' +
        order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
    console.log("mac = ", order.mac);
    try {
        const result = await axios.post(config.endpoint, null, { params: order });
        console.log(result.data)
        return res.json(result.data);
    } catch (error) {
        console.log(error.message);
    }
})
module.exports = router;

