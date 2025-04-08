import express from 'express';
import voucherRouter from './voucher.route.js';
import eventRouter from './event.route.js';
import eventListRouter from './eventList.route.js';
import policyRouter from './policy.route.js';

const router = express.Router();

// Các route khác giữ nguyên
router.use('/admin', eventRouter);
router.use('/adminPage-eventlist', eventListRouter);
router.use('/admin-policy', policyRouter);

// Chuyển /admin-voucher route lên trước để ưu tiên render page
router.get('/admin-voucher', (req, res) => {
    res.render('admin-voucher');  // Render EJS template
});

// API routes cho voucher
router.use('/admin-voucher/api', voucherRouter);

export default router;