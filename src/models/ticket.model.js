import { model, Schema } from 'mongoose'
const DOCUMENT_NAME = 'TicketModel'
const COLLECTION_NAME = 'Tickets'

const ticketSchema = new Schema(
    {
        TicketTypeID: {
            type: String,
            required: true,
        },
        customerFullname: {
            type: String,
            required: false,
        },
        customerDOB: {
            type: Date,
            required: false,
        },
        customerPhone: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['Available', 'Sold'],
            default: 'Available',
        },
        imgUrl: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

export default model(COLLECTION_NAME, ticketSchema)
