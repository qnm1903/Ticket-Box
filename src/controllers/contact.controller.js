import event from '../models/event.model.js'
import MongooseToObjectFunctions from '../utils/mongooseToObjectFunctions.js';
const getContact = async (req, res) => {
    const allEvents = await event.find()
    const eventData = MongooseToObjectFunctions.multipleMongooseToObject(allEvents)
    res.render('contact', { eventData })
}
export default getContact