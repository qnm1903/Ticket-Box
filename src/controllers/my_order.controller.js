import CustomerModel from "../models/customer.model.js";
import OrderModel from "../models/order.model.js";
import TicketModel from "../models/ticket.model.js"
import EventModel from "../models/event.model.js"

const getMyOrder = async (req, res, next) => {
    try {
        if (!req.session.customer) {
            return res.redirect('/login');
        }

        const session_customer = req.session.customer;
        const _customer = await CustomerModel.findById(session_customer._id);
        const _customerOrders = await OrderModel.find({customerID: session_customer._id}).lean();
        let _orderEvents = [];
        if (_customerOrders) {
            _orderEvents = await Promise.all(
                _customerOrders.map(async (order) => {
                    // Tìm ticket bất kì của order
                    const _ticket = await TicketModel.findById(order.orderDetails[0]).lean();
                    // Tìm event từ ticketType
                    const _event = await EventModel.find({ 'ticketType.ticketTypeId': _ticket.TicketTypeID}).limit(1).lean();
                    return _event[0];
                })
            );
        }

        // Lọc các event theo query filter
        const filterStatus = req.query.filter || 'all';
        if (filterStatus != 'all') {
            _orderEvents = _orderEvents.filter(order => {
                return order.status === filterStatus;
            });
        }

        // Tạo biến feedbackSubmitted tạm
        _orderEvents.forEach(order => {
            order.feedbackSubmitted = false;
        });

        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedOrders = _orderEvents.slice(startIndex, endIndex);
        res.render('my-order', {
            query: req.query,
            customer: _customer,
            tickets: paginatedOrders,
            currentPage: page,
            totalPages: Math.ceil(_orderEvents.length / limit)
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal Server Error");
    }
}

export default getMyOrder