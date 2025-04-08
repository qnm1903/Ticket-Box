'use strict'

// TODO: External Modules
import getHomepage from '../controllers/home.controller.js'
import accessRoutes from './access/index.js'
import eventRoutes from './event.router.js'
import orderRoutes from './order.router.js'
import getAbout from '../controllers/about.controller.js'
import getContact from '../controllers/contact.controller.js'
import getProduct from '../controllers/product.controller.js'
import eventDetailRoutes from './eventDetail.js'
import shoppingCartRoutes from './shoppingCart.router.js'
import getMyOrder from '../controllers/my_order.controller.js'
import express from 'express'
import profileRoutes from './profile/index.js'
const router = express.Router()
import {ensureAuthen} from "../middlewares/auth.js";
import paymentRoutes from "./payment.router.js";

import adminRouter  from './admin/index.js'  //Tạo event và ticket
import getVoucher from '../controllers/voucher.admin.controller.js'
// TODO: Main Route

// accessRoutes
router.use(accessRoutes)
// profile
router.use(profileRoutes)

router.get('/', getHomepage)
router.get('/about', getAbout)
router.get('/contact', getContact)
router.get('/product', getProduct)
router.get('/my-order', getMyOrder);

// eventDetailRoutes
router.use('/detail', eventDetailRoutes)




// ShoppingCartAPIRoutes
router.use('/', shoppingCartRoutes)

// eventRoutes
router.use(eventRoutes)



router.use(adminRouter)
//Trang voucher của admin


// orderRoutes
router.use('/', orderRoutes)
router.use(paymentRoutes)
export default router
