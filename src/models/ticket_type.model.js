import { model, Schema } from 'mongoose'
const COLLECTION_NAME = 'TicketTypes'

const ticketType = new Schema(
    {
        ticketTypeID: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        imgUrl: {
            type: String,
            required: false,
        },
    },
    {
        _id: false,
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

export default model(COLLECTION_NAME, ticketType)
