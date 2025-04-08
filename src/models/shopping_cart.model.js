import {model, Schema} from 'mongoose'
const COLLECTION_NAME = 'ShoppingCarts';

const ShoppingCartSchema = new Schema(
    {
        customerID: {
            type: String,
            required: true,
            unique: true
        },
        items: {
            type: [{ticketTypeID: {
                       type: String,
                       required: true
                    }, quantity: {
                        type: Number,
                        required: true
                    }
            }],
            _id: false
        }
    }, {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

export default model(COLLECTION_NAME, ShoppingCartSchema);