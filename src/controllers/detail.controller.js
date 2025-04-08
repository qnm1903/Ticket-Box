import mongoose from 'mongoose'
import event from '../models/event.model.js'
import MongooseToObjectFunctions from '../utils/mongooseToObjectFunctions.js';
import ticketType from '../models/ticket_type.model.js'
import { faker } from '@faker-js/faker'
import voucherModel from '../models/voucher.model.js';

class EventDetailController {
    getEventDetail = async (req, res, next) => {                
        try {
            const _event = await event.findOne({ _id: req.params.id });
            if (!_event) {
                return res.status(404).send('Event not found');
            }
            var _ticketTypes = [];
            if (_event.ticketType[0]?.name) {
                _ticketTypes = _event.ticketType;
            }
            else {
                _ticketTypes = await Promise.all(
                    _event.ticketType.map(async (_ticketTypeID) => {
                        return ticketType.findOne({ ticketTypeID: _ticketTypeID.ticketTypeId });
                    })
                );
            } 

            if (!_ticketTypes) {
                return res.status(404).send('Ticket types not found');
            }

            const minPrice = Math.min(..._ticketTypes.map(type => type.price));

            res.render('event', { customer: req.session.customer, event: MongooseToObjectFunctions.mongooseToObject(_event), ticketTypes: MongooseToObjectFunctions.multipleMongooseToObject(_ticketTypes), minPrice});
        } catch (error) {
            console.log('Error in getEventDetail:', error.message);
            return res.status(500).send('Internal Server Error');
        }
    }

    getBooking = async (req, res, next) => {
        try {
            if (!req.session.customer) {
                return res.redirect('/login');
            }
            const _event = await event.findOne({ _id: req.params.id });
            
            // if (_event.endDate <= Date.now()) {
            //     return res.redirect('/detail/' + req.params.id + '?error=event-expired');
            // }

            if (!_event) {
                return res.status(404).send('Event not found');
            }
            var _ticketTypes = [];
            if (_event.ticketType[0]?.name) {
                _ticketTypes = _event.ticketType;
            }
            else {
                _ticketTypes = await Promise.all(
                    _event.ticketType.map(async (_ticketTypeID) => {
                        return ticketType.findOne({ ticketTypeID: _ticketTypeID.ticketTypeId }).lean();
                    })
                );

                _ticketTypes.forEach(ticketType => {
                    ticketType["ticketTypeId"] = ticketType.ticketTypeID;
                });
            }
            if (!_ticketTypes) {
                return res.status(404).send('Ticket types not found');
            }
            // const vouchers = Array.from({ length: 5 }).map(() => ({
            //     id: faker.datatype.uuid,
            //     name: faker.string.alphanumeric(5),
            //     discount: faker.number.int({min: 5, max: 50}), // Giảm giá ngẫu nhiên từ 5% đến 50%
            // }))
            var vouchers = await voucherModel.find();
            // get vouchers with end date > now
            const now = new Date();
            vouchers = vouchers.filter(voucher => voucher.endDate > now);
            res.render('eventDetail/booking.ejs', {
                customer: req.session.customer,
                event: MongooseToObjectFunctions.mongooseToObject(_event),
                ticketTypes: _ticketTypes,
                vouchers
            });
        } catch (error) {
            console.log('Error in getBookingTicket:', error.message);
            return res.status(500).send('Internal Server Error');
        }
    }
}

export default new EventDetailController()

