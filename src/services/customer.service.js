import customerModel  from "../models/customer.model.js";

class CustomerService {
    static async findByEmail({ email, select = { email: 1, password: 1, name: 1 } }) {
        return await customerModel.findOne({ email }).select(select).lean()
    }
}

export default CustomerService;
