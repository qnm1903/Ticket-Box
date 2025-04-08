import TicketTypeModel from '../models/ticket_type.model.js'

const findByNewRelease = async () => {
    return await TicketTypeModel.find().sort({ createdAt: -1 }).limit(5).lean()
}
const findByRecommend = async () => {
    return await TicketTypeModel.find().sort({ quantity: -1 }).limit(5).lean()
}
const findByCategory = async ({ category }) => {
    return await TicketTypeModel.find({ category }).lean()
}
const TicketTypeService = {
    findByNewRelease,
    findByRecommend,
    findByCategory,
}
export default TicketTypeService
