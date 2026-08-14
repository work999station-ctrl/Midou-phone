const mongoose = require('mongoose');

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 20,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
        });
        console.log('connection successfully');
    } catch (err) {
        console.log('connection failed ' + err.message);
    }
}

module.exports = { connection };