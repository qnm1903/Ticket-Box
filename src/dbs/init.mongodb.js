'use strict'

import mongoose from 'mongoose'
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
// import config from '../configs/enviroment.config.js';
// const dbConfig = config.db;
let connectString = process.env.MONGODB_URL;
// if(dbConfig.host === 'localhost'){
//      connectString = 'mongodb://localhost:27017/TicketZEN'
// }
// console.log(connectString)
// TODO: Singleton pattern
class Database {
    static instance = null;
    constructor() {
        this._connect();
    }

    // TODO: Connected to mongodb
    _connect() {
        if (true) {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true });
        }

        mongoose.connect(connectString, {
            maxPoolSize: 50 // TODO: Max connection
        })
            .then(() => {
                console.log(`Connected to mongodb`)
            })
            .catch(err => {
                console.log('Connect to mongodb failed');
                console.error(err);
            })
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Database();
        }

        return this.instance;
    }

}

export default Database.getInstance();