import { model, Schema } from 'mongoose'
const COLLECTION_NAME = 'Vouchers'

const voucherSchema = new Schema(
    {
        voucherName: {
            type: String,
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min : 1, max : 100
        },
        maxDiscount: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min : 1
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)
export default model(COLLECTION_NAME, voucherSchema)
