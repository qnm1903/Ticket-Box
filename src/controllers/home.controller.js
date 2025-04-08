import EventService from '../services/event.service.js'
import MongooseToObjectFunctions from '../utils/mongooseToObjectFunctions.js'
import EventModel from '../models/event.model.js'
import TicketTypeService from '../services/ticket_type.service.js'
const getHomepage = async (req, res) => {
    const allEvents = await EventModel.find()
    // console.log('allEvents:', allEvents)
    const events = await EventService.findRecomendedEvents()
    const musicEvents = await EventService.findByCategory({ category: 'Music' })
    const artEvents = await EventService.findByCategory({ category: 'Art' })
    // const recommendTicketTypes = await TicketTypeService.findByRecommend()

    const newReleaseEvents = await EventModel.find().sort({ createdAt: -1 }).select("title category status imgURL addressProvince addressDetail visitCount").limit(5).hint({ createdAt: -1, title: 1, category: 1, status: 1, imgURL: 1}).lean();
    // get the first of recommendedTicketTypes and the 3 first of newReleaseTicketTypes
    // const nowShowing = [recommendTicketTypes[0]].concat(newReleaseTicketTypes.slice(0, 3))
    // console.log('nowShowing:', nowShowing)
    // console.log('events:', MongooseToObjectFunctions.multipleMongooseToObject(allEvents))
    const eventData = MongooseToObjectFunctions.multipleMongooseToObject(allEvents)
    // console.log('eventData:', eventData)
    try {
        res.render('index', { events, musicEvents, artEvents, newReleaseEvents, eventData })
    } catch (error) {
        res.render('index', { events, musicEvents, artEvents, newReleaseEvents, eventData })
    }
    // return res.render('index')

    //         const recommendTicketTypes = await TicketTypeService.findByRecommend()
    //         const newReleaseTicketTypes = await TicketTypeService.findByNewRelease()
    //         // get the first of recommendedTicketTypes and the 3 first of newReleaseTicketTypes
    //         const nowShowing = [recommendTicketTypes[0]].concat(newReleaseTicketTypes.slice(0, 3))
    //         try{
    //             res.render('index', {events, nowShowing })

    //     } catch (error) {
    //             res.render('index', {events, nowShowing })    }
}

export default getHomepage
