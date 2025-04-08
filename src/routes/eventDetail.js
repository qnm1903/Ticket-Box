'use strict'
import express from 'express';
import EventDetailController from '../controllers/detail.controller.js'

const router = express.Router();
router.get('/', EventDetailController.getEventDetail);
router.get('/:id', EventDetailController.getEventDetail);
router.get('/:id/booking', EventDetailController.getBooking);
// router.get('/:id/booking/info', EventDetailController.getInfoFilling);
// router.get('/:id/booking/info/payment', EventController.getPayment);

export default router;