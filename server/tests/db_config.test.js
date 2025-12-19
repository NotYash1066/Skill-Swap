const mongoose = require('mongoose');
const connectDB = require('../config/db');

jest.mock('mongoose');
jest.mock('../utils/logger');

describe('Database Configuration', () => {
    it('should connect with pooling and timeout options', async () => {
        mongoose.connect.mockResolvedValue({ connection: { host: 'localhost' } });
        
        await connectDB();
        
        expect(mongoose.connect).toHaveBeenCalledWith(
            expect.stringContaining('mongodb'),
            expect.objectContaining({
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            })
        );
    });
});
