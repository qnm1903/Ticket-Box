'use strict'

const dev = {
    app:{
        port: process.env.DEV_APP_PORT,
    },
    db: {
        host: process.env.DEV_DB_HOST,
        port: process.env.DEV_DB_PORT,
        name: process.env.DEV_DB_NAME,
        user: process.env.DEV_DB_USER,
        password: process.env.DEV_DB_PASSWORD,
    }
}
const pro = {
    app:{
        port: process.env.PRO_APP_PORT,
    },
    db: {
        host: process.env.PRO_DB_HOST,
        port: process.env.PRO_DB_PORT,
        name: process.env.PRO_DB_NAME,
        user: process.env.PRO_DB_USER,
        password: process.env.PRO_DB_PASSWORD,
    },
}
const config = {dev, pro}
const env = process.env.NODE_ENV || 'pro'
export default config[env]
