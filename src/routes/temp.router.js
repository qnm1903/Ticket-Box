'use strict'
import express from 'express'
import OrderController from '../controllers/order.controller.js'
import forwardError from '../utils/forwardError.js'
import { authenticationV2 } from '../middlewares/auth.js'
import EventDetailController from '../controllers/detail.controller.js'
const router = express.Router()
// GET
router.get('/', OrderController.getCart)
router.get('/:id', OrderController.getEventDetail)

// POST
// router.post('/cart', forwardError(accessController.signUp))

export default router
