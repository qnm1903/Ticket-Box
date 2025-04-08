'use strict'

import { OkResponse } from '../core/success.response.js'
// import { BadRequestResponse } from '../core/error.response.js'
import EventService from '../services/event.service.js'

// TODO: API login
const getEventByCategory = async (req, res) => {
    try {
        const events = await EventService.findByCategory(req.body)
        res.status(200).json(events)
        // res.render('index', { events });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const EventController = {
    getEventByCategory,
}

export default EventController