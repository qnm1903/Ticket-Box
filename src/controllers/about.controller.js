import event from '../models/event.model.js'
import MongooseToObjectFunctions from '../utils/mongooseToObjectFunctions.js';
const getAbout = async (req, res) => {
    const allEvents = await event.find()
    const eventData = MongooseToObjectFunctions.multipleMongooseToObject(allEvents)
    
    res.render('about', { eventData })
}
export default getAbout