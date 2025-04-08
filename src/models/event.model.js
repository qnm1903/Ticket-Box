import { model, Schema } from 'mongoose'
const DOCUMENT_NAME = 'EventModel'
const COLLECTION_NAME = 'Events'

// ticketType datatype
const ticketType = new Schema(
    {
        ticketTypeId: {
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
    },
)

const eventSchema = new Schema(
    {
        addressProvince: {
            type: String,
            required: false,
        },
        addressDetail: {
            type: String,
            required: false,
        },
        startDate: {
            type: Date,
            required: false,
        },
        endDate: {
            type: Date,
            required: false,
        },
        visitCount: {
            type: Number,
            required: false,
        },
        category: {
            type: String,
            required: false,
        },
        // status with enum type
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        title: {
            type: String,
            required: false,
        },
        ticketType: {
            type: [ticketType],
            required: false,
        },
        organizerID: {
            type: String,
            required: false,
        },
        organizerName: {
            type: String,
            required: false,
        },
        organizerImgURL: {
            type: String,
            required: false,
        },
        imgURL: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
        eventType: {
            type: String,
            required: false,
        },
        eventLogo: {
            type: String,
            required: false,
        },
        eventBanner: {
            type: String,
            required: false,
        },
        venueName: {
            type: String,
            required: false,
        },
        district: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

eventSchema.index({ createdAt: -1, title: 1, category: 1, status: 1, imgURL: 1});

const EventModel = model(COLLECTION_NAME, eventSchema)

export default EventModel
