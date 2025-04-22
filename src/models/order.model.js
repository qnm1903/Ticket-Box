import { model, Schema } from 'mongoose'
const COLLECTION_NAME = 'Orders'

const paymentSchema = new Schema(
    {
        methodPayment: {
            type: String,
            required: true,
            enum: ['momo', 'zalopay'],
        },
        datePayment: {
            type: Date,
            required: true,
        },
    },
    {
        _id: false,
    },
)

const orderSchema = new Schema(
    {
        customerID: {
            type: Schema.Types.ObjectId,
            ref: 'Customers',
            required: true,
        },
        subTotal: {
            type: Number,
            required: true,
        },
        orderDetails: {
            type: [String],
            required: false,
        },
        voucherID: {
            type: Schema.Types.ObjectId,
            ref: 'Vouchers',
            required: false,
        },
        discountAmount: {
            type: Number,
            required: false,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        payment: {
            type: paymentSchema,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)
export default model(COLLECTION_NAME, orderSchema)
