import express from 'express'
import PaymentController from '../controllers/payment.controller.js'
import { authenticationV2 } from '../middlewares/auth.js'

const router = express.Router();

router.post('/api/v1/payment', PaymentController.createPayment);
router.get('/payment-result', PaymentController.getPaymentResult);
router.post('/api/v1/payment-status', PaymentController.getPaymentStatus);
router.get('/api/v1/payment-status-zalopay', PaymentController.getPaymentStatusZaloPay);

export default router;