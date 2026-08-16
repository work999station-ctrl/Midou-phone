const mongoose = require('mongoose');

const connection = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb+srv://projectteamx999_db_user:IJuYe1FSW63yud8P@hanout.tan3v5a.mongodb.net/test?retryWrites=true&w=majority&appName=Hanout";
        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed: ' + err.message);
        throw err;
    }
}

module.exports = { connection };