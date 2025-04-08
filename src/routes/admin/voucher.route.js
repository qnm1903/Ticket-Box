import express from 'express';
import Voucher from '../../models/voucher.model.js';
const router = express.Router();

// Route để lấy danh sách voucher qua API
router.get('/vouchers', async (req, res) => {
    try {
        const vouchers = await Voucher.find({}).sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            vouchers: vouchers 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching vouchers: ' + err.message 
        });
    }
});

// Route filter theo status
router.get('/status/:status', async (req, res) => {
    try {
        const status = req.params.status;
        const currentDate = new Date();
        
        let query = {};
        if (status === 'active') {
            query.endDate = { $gte: currentDate };
        } else if (status === 'expired') {
            query.endDate = { $lt: currentDate };
        }

        const vouchers = await Voucher.find(query).sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            vouchers: vouchers 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching vouchers by status: ' + err.message 
        });
    }
});

// Route search
router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.name || '';
        const vouchers = await Voucher.find({
            voucherName: { $regex: searchTerm, $options: 'i' }
        }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            vouchers: vouchers 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Error searching vouchers: ' + err.message 
        });
    }
});

// Route thêm voucher
router.post('/add', async (req, res) => {
    try {
        console.log('Received request body:', req.body); // Log request data

        const { voucherName, discountValue, maxDiscount, startDate, endDate, quantity } = req.body;

        // Log các giá trị nhận được
        console.log('Parsed values:', {
            voucherName,
            discountValue,
            maxDiscount,
            startDate,
            endDate,
            quantity
        });

        // Kiểm tra giá trị null/undefined
        if (!voucherName || !discountValue || !maxDiscount || !startDate || !endDate || !quantity) {
            console.log('Missing fields:', {
                voucherName: !voucherName,
                discountValue: !discountValue,
                maxDiscount: !maxDiscount,
                startDate: !startDate,
                endDate: !endDate,
                quantity: !quantity
            });
            
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin voucher',
                missingFields: {
                    voucherName: !voucherName,
                    discountValue: !discountValue,
                    maxDiscount: !maxDiscount,
                    startDate: !startDate,
                    endDate: !endDate,
                    quantity: !quantity
                }
            });
        }

        // Validate dữ liệu
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
            return res.status(400).json({
                success: false,
                message: 'Giá trị giảm giá không hợp lệ (phải từ 1-100)'
            });
        }

        if (isNaN(maxDiscount) || maxDiscount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Giảm giá tối đa phải lớn hơn 0'
            });
        }

        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        const newVoucher = new Voucher({
            voucherName,
            discountValue: Number(discountValue),
            maxDiscount: Number(maxDiscount),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            quantity: Number(quantity)
        });

        console.log('Creating new voucher:', newVoucher); // Log voucher object

        await newVoucher.save();
        console.log('Voucher saved successfully'); // Log success

        res.status(201).json({
            success: true,
            message: 'Tạo voucher thành công!',
            voucher: newVoucher
        });
    } catch (err) {
        console.error('Error creating voucher:', err); // Log error details
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo voucher: ' + err.message,
            error: err.stack
        });
    }
});

// Route xóa voucher
router.delete('/:id', async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher'
            });
        }
        res.json({
            success: true,
            message: 'Xóa voucher thành công!'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa voucher: ' + err.message
        });
    }
});

export default router;