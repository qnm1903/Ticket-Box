import mongoose from 'mongoose'
const { Schema, model } = mongoose
const DOCUMENT_NAME = 'KeyToken'
const COLLECTION_NAME = 'KeyTokens'

// Declare the Schema of the Mongo model
const tokenSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        publicKey: {
            type: String,
            required: true,
        },
        privateKey: {
            type: String,
            required: true,
        },
        refreshTokensUsed: {
            type: Array,
            default: [],
        },
        refreshToken: {
            type: String,
            required: true,
        },
        verificationCode: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

//Export the model
export default model(COLLECTION_NAME, tokenSchema)
