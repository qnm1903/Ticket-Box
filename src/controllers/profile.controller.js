import multer from 'multer';
import path from 'path';
import CustomerModel from "../models/customer.model.js";
import OrderModel from '../models/order.model.js';
import EventModel from '../models/event.model.js';
import core from "../core/error.response.js";

const { NotFoundRequest, InternalServerError } = core;

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/img/uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extName && mimeType) {
            return cb(null, true);
        }
        cb(new Error("Only images are allowed!"));
    }
});

class ProfileController {
    // Middleware for file uploads
    uploadAvatar = upload.single('avatar');

    async getProfile(req, res) {
        try {
            const session_customer = req.session.customer;
            const customer = await CustomerModel.findById(session_customer._id);

            console.log('Session:', req.session);
            if (!customer) {
                return res.redirect('/login');
            }

            if (customer.DOB) {
                customer.DOB = new Date(customer.DOB);
            }

            res.render('profile', { customer });
        } catch (error) {
            console.error(error);
            res.redirect('/login');
        }
    }


    async updateProfile(req, res, next) {
        try {
            const { fullName, DOB, gender, address, phone } = req.body;
            const customer_id = req.session.customer._id;

            if (!customer_id) {
                throw new NotFoundRequest("Customer not found in session");
                res.redirect('/login');
            }

            const updatedData = { fullName, DOB, gender, address, phone };

            // Handle avatar upload
            if (req.file) {
                console.log(`Uploaded avatar path: /img/uploads/avatars/${req.file.filename}`);

                updatedData.avatar = `/img/uploads/avatars/${req.file.filename}`;

            }

            const updatedCustomer = await CustomerModel.findByIdAndUpdate(
                customer_id,
                updatedData,
                { new: true, runValidators: true }
            );

            if (!updatedCustomer) {
                throw new NotFoundRequest("Customer not found");
            }

            req.session.customer = updatedCustomer;
            res.redirect('/profile');
        } catch (error) {
            res.redirect('/login');        }
    }
}

export default new ProfileController();
