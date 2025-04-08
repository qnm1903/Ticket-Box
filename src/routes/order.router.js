'use strict'
import express from 'express'
import OrderController from '../controllers/order.controller.js'
import forwardError from '../utils/forwardError.js'
import { authenticationV2 } from '../middlewares/auth.js'

const router = express.Router()
// GET
    router.get('/cart/:id', OrderController.getCart)
// router.get('/:id/booking', EventDetailController.getBooking);

// POST
// router.post('/cart', forwardError(accessController.signUp))

export default router
