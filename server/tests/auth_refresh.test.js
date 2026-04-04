const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');

describe('Auth Refresh Logic', () => {
    let app;
    let userId;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        // Mock simple rate limiters to avoid import errors or blocking
        app.use((req, res, next) => next()); 
        app.use('/api/auth', authRoutes);
        
        process.env.JWT_SECRET = 'testsecret';
        process.env.REFRESH_TOKEN_SECRET = 'refreshsecret'; // We need this
        userId = new mongoose.Types.ObjectId();
        
        User.findOne.mockResolvedValue({ 
            id: userId, 
            _id: userId, 
            password: 'hashedpassword',
            save: jest.fn()
        });
        User.findById.mockResolvedValue({ 
            id: userId, 
            _id: userId 
        });
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('hashedpassword');
        bcrypt.genSalt.mockResolvedValue('salt');
    });

    it('should return accessToken and refreshToken on login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password' });
            
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        const savedUser = await User.findOne.mock.results[0].value;
        expect(savedUser.refreshToken).toBe(res.body.refreshToken);
        expect(savedUser.save).toHaveBeenCalled();
    });

    it('should allow refreshing access token with valid refresh token', async () => {
        const refreshToken = jwt.sign(
            { user: { id: userId } }, 
            'refreshsecret', // Different secret
            { expiresIn: '7d' }
        );

        User.findById.mockResolvedValueOnce({
            id: userId,
            _id: userId,
            refreshToken
        });

        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.success).toBe(true);
    });
});
