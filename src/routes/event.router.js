'use strict'
import express from 'express'
import EventController from '../controllers/event.controller.js'
import forwardError from '../utils/forwardError.js'

const router = express.Router()
// GET

// POST
router.post('/eventAdmin', forwardError(EventController.getEventByCategory))

export default router
