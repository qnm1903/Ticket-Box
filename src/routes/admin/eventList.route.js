// routes/adminPage-eventlist.js
import express from 'express';
import EventModel from '../../models/event.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;

        console.log('Request received for page:', page);

        const totalEvents = await EventModel.countDocuments({ status: 'Active' });
        console.log('Total events:', totalEvents);

        const totalPages = Math.ceil(totalEvents / limit);
        console.log('Total pages:', totalPages);

        const events = await EventModel.find({ status: 'Active' })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ startDate: 'asc' })
            .select('title startDate endDate status ticketType imgUrl addressDetail');

        console.log('Events found:', events.length);

        const transformedEvents = events.map(event => ({
            _id: event._id,
            name: event.title,
            date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A',
            status: event.ticketType && event.ticketType.length > 0 ? 'on-sale' : 'sold-out',
            location: event.addressDetail || 'Chưa cập nhật'
        }));

        const responseData = {
            events: transformedEvents,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        console.log('Response data prepared:', responseData);

        // Nếu là AJAX request hoặc yêu cầu JSON
        if (req.xhr || req.headers.accept.includes('application/json')) {
            console.log('Sending JSON response');
            return res.json(responseData);
        }

        // Render full page
        console.log('Rendering full page');
        res.render('adminPage-eventlist', responseData);

    } catch (error) {
        console.error('Detailed error:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({ 
                error: 'Lỗi khi tải danh sách sự kiện',
                details: error.message
            });
        }
        res.status(500).send('Lỗi khi tải danh sách sự kiện');
    }
});

export default router;