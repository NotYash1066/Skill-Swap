const mongoose = require('mongoose');

const connect = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SkillSwapTestDB';
        await mongoose.connect(mongoUri, {
             serverSelectionTimeoutMS: 5000 // Fail faster if DB is down
        });
    } catch (error) {
        console.error('Test DB Connection Error:', error);
        throw error;
    }
};

const close = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
};

const clear = async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    }
};

module.exports = { connect, close, clear };
