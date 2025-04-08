'use strict';

import EventModel from '../models/event.model.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class EventController {
    // GET /event - Render event creation form
    async createEvent(req, res) {
        try {
            res.render('createEvent');
        } catch (error) {
            console.error('Error rendering event creation page:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error rendering event creation page',
                error: error.message
            });
        }
    }

    // POST /event - Handle event creation
    async handleCreateEvent(req, res) {
        try {
            console.log('Received event data');
            
            const {
                title,
                addressProvince,
                addressDetail,
                startDate,
                endDate,
                category,
                status,
                description,
                eventType,
                venueName,
                district,
                ticketType,
                eventLogo,
                eventBanner,
                organizer,
            } = req.body;

            // Validate required fields
            const requiredFields = {
                title,
                addressProvince,
                addressDetail,
                startDate,
                endDate,
                category,
                description,
                venueName,
                district,
                eventLogo,
                eventBanner,
                organizer,
            };
            console.log('Required fields:', requiredFields);
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Missing required fields',
                    missingFields
                });
            }

            // Validate dates
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);

            if (isNaN(startDateTime) || isNaN(endDateTime)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Invalid date format'
                });
            }

            if (endDateTime <= startDateTime) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'End date must be after start date'
                });
            }

            // Validate ticket types
            if (!Array.isArray(ticketType) || ticketType.length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'At least one ticket type is required'
                });
            }

            // Validate each ticket type
            const invalidTickets = ticketType.filter(ticket => 
                !ticket.name || 
                typeof ticket.price !== 'number' || 
                typeof ticket.quantity !== 'number' ||
                !ticket.description
            );

            if (invalidTickets.length > 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Invalid ticket type data',
                    invalidTickets
                });
            }
            // Create new event
            const newEvent = new EventModel({
                title,
                addressProvince,
                addressDetail,
                startDate: startDateTime,
                endDate: endDateTime,
                category,
                status: 'Active',
                description,
                eventType,
                venueName,
                district,
                eventLogo,
                eventBanner,
                imgURL: eventBanner,
                visitCount: Math.floor(Math.random() * 1000),
                ticketType: ticketType.map(ticket => {
                    const height_random = Math.floor(Math.random() * 1000);
                    const width_random = Math.floor(Math.random() * 1000);
                    return {
                        ticketTypeId: Math.random().toString(36).substring(7),
                        name: ticket.name,
                        quantity: Number(ticket.quantity),
                        price: Number(ticket.price),
                        description: ticket.description,
                        imgUrl: 'https://picsum.photos/' + width_random + '/' + height_random
                    }
                }),
                organizerName: organizer.name,
                organizerImgURL: organizer.logo
            });

            const savedEvent = await newEvent.save();
            console.log('Event created successfully:', savedEvent._id);

            res.status(HTTP_STATUS.CREATED).json({
                message: 'Event created successfully',
                data: savedEvent
            });
        } catch (error) {
            console.error('Error creating event:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error creating event',
                error: error.message
            });
        }
    }

    // GET /events - Get all events
    async getAllEvents(req, res) {
        try {
            const {
                category,
                province,
                district,
                startDate,
                endDate,
                status,
                eventType
            } = req.query;

            // Build filter object
            let filter = {};

            if (category) filter.category = category;
            if (province) filter.addressProvince = province;
            if (district) filter.district = district;
            if (status) filter.status = status;
            if (eventType) filter.eventType = eventType;

            // Date range filter
            if (startDate || endDate) {
                filter.startDate = {};
                if (startDate) filter.startDate.$gte = new Date(startDate);
                if (endDate) filter.startDate.$lte = new Date(endDate);
            }

            const events = await EventModel.find(filter)
                .sort({ createdAt: -1 });

            res.status(HTTP_STATUS.OK).json({
                message: 'Events retrieved successfully',
                data: events
            });

        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error retrieving events',
                error: error.message
            });
        }
    }

    // GET /event/:id - Get single event
    async getEventById(req, res) {
        try {
            const { id } = req.params;

            const event = await EventModel.findById(id);

            if (!event) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    message: 'Event not found',
                    error: 'Event not found'
                });
            }

            // Increment visit count
            event.visitCount = (event.visitCount || 0) + 1;
            await event.save();

            res.status(HTTP_STATUS.OK).json({
                message: 'Event retrieved successfully',
                data: event
            });

        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error retrieving event',
                error: error.message
            });
        }
    }

    // PUT /event/:id - Update event
    async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Convert dates if provided
            if (updateData.startDate) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.endDate) {
                updateData.endDate = new Date(updateData.endDate);
            }

            const updatedEvent = await EventModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            if (!updatedEvent) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    message: 'Event not found',
                    error: 'Event not found'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                message: 'Event updated successfully',
                data: updatedEvent
            });

        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error updating event',
                error: error.message
            });
        }
    }

    // DELETE /event/:id - Delete event
    async deleteEvent(req, res) {
        try {
            const { id } = req.params;

            const deletedEvent = await EventModel.findByIdAndDelete(id);

            if (!deletedEvent) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    message: 'Event not found',
                    error: 'Event not found'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                message: 'Event deleted successfully',
                data: deletedEvent
            });

        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error deleting event',
                error: error.message
            });
        }
    }

    // POST /event/:eventId/ticket - Add ticket type to event
    async addTicketType(req, res) {
        try {
            const { eventId } = req.params;
            const { name, price, quantity, description } = req.body;

            console.log('Adding ticket type to event:', eventId);
            console.log('Ticket data:', req.body);

            // Find event
            const event = await EventModel.findById(eventId);
            if (!event) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    message: 'Event not found'
                });
            }

            // Ensure ticketTypes is an array
            if (!Array.isArray(event.ticketTypes)) {
                event.ticketTypes = [];
            }

            // Create new ticket
            const newTicket = {
                ticketTypeId: Math.random().toString(36).substring(7),
                name,
                price: Number(price),
                quantity: Number(quantity),
                description: description || ''
            };

            // Add to array
            event.ticketTypes.push(newTicket);

            // Save changes
            const updatedEvent = await event.save();
            console.log('Ticket added successfully:', newTicket);
            console.log('Updated event:', updatedEvent);

            res.status(HTTP_STATUS.OK).json({
                message: 'Ticket type added successfully',
                data: updatedEvent
            });

        } catch (error) {
            console.error('Error adding ticket type:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: 'Error adding ticket type',
                error: error.message
            });
        }
    }
}

export default new EventController();