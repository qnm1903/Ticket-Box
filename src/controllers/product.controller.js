import event from '../models/event.model.js'
import MongooseToObjectFunctions from '../utils/mongooseToObjectFunctions.js';

const getProduct = async (req, res) => {
    const allEvents = await event.find({}).lean();
    const _notableEvents = await event.find({}).sort({visitCount: -1}).limit(4).lean();
    if (!_notableEvents) {
        return res.status(404).send('Notable events not found');
    }

    const _specialEvents = await event.find({}).sort({createdAt: -1}).limit(5).lean();
    if (!_specialEvents) {
        return res.status(404).send('Special events not found');
    }
    
    //TODO: addressProvince: customer.addressProvince
    const _eventsNearYou = await event.find({addressProvince: "Ho Chi Minh", status: "Active"}).sort({createdAt: -1}).limit(5).lean();
    if (!_eventsNearYou) {
        return res.status(404).send('Events near you not found');
    }

    const _musicEvents = await event.find({category: 'Music', status:"Active"}).sort({createdAt: -1}).limit(8).lean();
    if (!_musicEvents) {
        return res.status(404).send('music events not found');
    }

    const _performanceOrArtEvents = await event.find({$and:[{$or: [{category:"Performance"},{category:"Art"}]}, {status:"Active"}]}).sort({createdAt: -1}).limit(8).lean();
    if (!_performanceOrArtEvents) {
        return res.status(404).send('Performance or Arts events not found');
    }

    const _otherEvents = await event.find({category: {$nin: ['Music','Performance','Art']}}).limit(8).lean();
    if (!_otherEvents) {
        return res.status(404).send('Other events not found');
    }
    const eventData = allEvents
    res.render('product', {
        customer: req.session.customer,
        notableEvents: _notableEvents,
        specialEvents: _specialEvents,
        eventsNearYou: _eventsNearYou,
        musicEvents: _musicEvents,
        performanceOrArtEvents: _performanceOrArtEvents,
        otherEvents: _otherEvents,
        eventData
    });
}
export default getProduct