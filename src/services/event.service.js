import EventModel from '../models/event.model.js'

const findByCategory = async ({ category, limit=5 }) => {
    return await EventModel.find({ category }).limit(limit).lean()
}

const findRecomendedEvents = async () => {
    // find the 5 most visited events
    return await EventModel.find().sort({ visitCount: -1 }).limit(5).lean()
}

const findByNewRelease = async () => {
    return await EventModel.find().sort({ createdAt: -1 }).limit(5).lean()
}

const findAll = async () => {
    return await EventModel.find().lean()
}

const EventService = {
    findAll,
    findByCategory,
    findRecomendedEvents,
    findByNewRelease
}

export default EventService
