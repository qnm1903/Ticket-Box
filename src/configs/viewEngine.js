import express from 'express'
import morgan from 'morgan'
import path from 'path'
import compression from 'compression'
import session from 'express-session'
import MongoStore from 'connect-mongo'

const configViewEngine = (app) => {
    const __dirname = path.resolve()
    app.use(express.static('public')) // Giả sử file CSS nằm trong thư mục `public/css`
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, 'src/views'))

    app.use(compression())
    // HTTP logger
    app.use(morgan('tiny'))
    app.use(express.urlencoded({ extended: true, limit: '50mb' })) // For parsing form data
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'your_secret_key',
            resave: false,
            saveUninitialized: true,
            store: MongoStore.create({
                mongoUrl: 'mongodb+srv://group11_22_1:gr11_22_1_cnpm@ticketboxcluster.ucgdq.mongodb.net/TicketBox?retryWrites=true&w=majority&appName=TicketBoxCluster', // Sửa lại URL MongoDB của bạn nếu cần
                collectionName: 'sessions', // Tên collection lưu trữ session
                ttl: 14 * 24 * 60 * 60, // Thời gian sống của session (14 ngày)
            }),
            cookie: {
                secure: false, // Chỉnh lại thành true khi bạn sử dụng HTTPS
                maxAge: 1000 * 60 * 60 * 24 * 14, // Thời gian sống của cookie (14 ngày)
            },
        }),
    )
    // app.use(express.json()) // Để xử lý dữ liệu JSON
    app.use(express.json({limit: '50mb'}));
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`)
        next()
    })
}

export default configViewEngine
