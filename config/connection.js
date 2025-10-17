const mongoose = require('mongoose');

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI + process.env.MONGODB_DB_NAME);
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection error:', err.message);
    }
};

connectToDatabase();

module.exports = mongoose;
