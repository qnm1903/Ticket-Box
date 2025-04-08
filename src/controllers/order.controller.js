'use strict'

import { OkResponse } from '../core/success.response.js'
import { faker } from '@faker-js/faker'
import Event from '../models/event.model.js'
import TicketType from '../models/ticket_type.model.js'
// import { BadRequestResponse } from '../core/error.response.js'
// import OrderService from '../services/order.service.js'

// TODO: API login
const getCart = async (req, res) => {
    try {
        // const orders = await OrderService.findByCategory(req.body)
        // res.status(200).json(orders)
        const _event = await Event.findOne({ _id: req.params.id });
        if (!_event) {
            return res.status(404).send('Event not found');
        }
    
        const _ticketTypes = await Promise.all(
            _event.ticketType.map(async (_ticketTypeID) => {
                return TicketType.findOne({ ticketTypeID: _ticketTypeID });
            })
        );
        if (!_ticketTypes) {
            return res.status(404).send('Ticket types not found');
        }
        // const tickets = Array.from({ length: 5 }).map(() => ({
        //     id: faker.datatype.uuid,
        //     image: faker.image.avatarGitHub(), // Ảnh ngẫu nhiên
        //     name: faker.commerce.productName(),
        //     price: faker.commerce.price(100000, 1000000), // Giá vé ngẫu nhiên từ 100.000 đến 1.000.000
        //     quantity: 1, // Ví dụ, mỗi ticket bắt đầu với số lượng 1
        // }))

        // Sinh ngẫu nhiên danh sách voucher
        const vouchers = Array.from({ length: 15 }).map(() => ({
            id: faker.datatype.uuid,
            name: faker.commerce.productName(),
            discount: faker.number.float(0.05, 0.5), // Giảm giá ngẫu nhiên từ 5% đến 50%
        }))

        // Tính toán tổng giá trị của vé
        const totalPrice = _ticketTypes.reduce((total, ticket) => total + ticket.price * ticket.quantity, 0)

        // Tính tổng giảm giá
        const totalDiscount = vouchers.reduce((total, voucher) => total + (voucher.discount / 100) * totalPrice, 0)

        // Tổng giá sau khi giảm
        const finalPrice = totalPrice - totalDiscount

        // Truyền dữ liệu vào view EJS
        res.render('cart', {
            customer: req.session.customer,
            tickets: _ticketTypes,
            vouchers,
            totalPrice,
            totalDiscount,
            finalPrice,
        })
        // res.render('cart')
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const OrderController = {
    getCart,
}

export default OrderController
