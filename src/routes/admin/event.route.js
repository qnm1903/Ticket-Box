import express from 'express'
const router = express.Router();
import eventController from '../../controllers/event.admin.controller.js'

// POST route to create a new event
router.post('/', eventController.handleCreateEvent);

// PATCH route to update an existing event
router.patch('/:eventId', eventController.updateEvent);

// GET route to get all events
router.get('/', eventController.getAllEvents);

// GET route to get a single event by ID

router.get('/:eventId', eventController.getEventById);
// DELETE route to delete an event
router.delete('/:eventId', eventController.deleteEvent);

// POST route to add ticket type to event
router.post('/:eventId/ticket', eventController.addTicketType);

export default router
