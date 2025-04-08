import { model, Schema } from 'mongoose'
const DOCUMENT_NAME = 'CustomerModel'
const COLLECTION_NAME = 'Customers'
const customerSchema = new Schema(
    {
        fullName: {
            type: String,
            required: false,
        },
        DOB: {
            type: Date,
            required: false,
        },
        gender: {
            type: String,
            required: false,
        },
        address: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

const CustomerModel = model(COLLECTION_NAME, customerSchema)

export default CustomerModel
