class MongooseToObjectFunctions {
    multipleMongooseToObject = (mongooses) => {
        return mongooses.map(mongoose => mongoose.toObject());
    };
    mongooseToObject = (mongoose) => {
        return mongoose ? mongoose.toObject() : mongoose;
    };

    static getInstance = () => {
        if (!this.instance) {
            this.instance = new MongooseToObjectFunctions();
        }
        return this.instance;
    }
}


export default MongooseToObjectFunctions.getInstance();