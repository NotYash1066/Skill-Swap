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
        app.use('/api/auth', authRoutes);

        process.env.JWT_SECRET = 'test-access-secret';
        process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
        userId = new mongoose.Types.ObjectId();

        User.findOne.mockResolvedValue({
            id: userId.toString(),
            _id: userId,
            tokenVersion: 0,
            password: 'hashedpassword',
            save: jest.fn()
        });
        User.findById.mockResolvedValue({
            id: userId.toString(),
            _id: userId,
            tokenVersion: 0,
            refreshToken: undefined,
            save: jest.fn()
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

        const decodedAccessToken = jwt.verify(res.body.token, process.env.JWT_SECRET);
        const decodedRefreshToken = jwt.verify(res.body.refreshToken, process.env.REFRESH_TOKEN_SECRET);
        expect(decodedAccessToken.user).toMatchObject({ id: userId.toString(), tokenVersion: 0 });
        expect(decodedRefreshToken.user).toMatchObject({ id: userId.toString(), tokenVersion: 0 });
    });

    it('should rotate refresh token when refreshing access token', async () => {
        const refreshToken = jwt.sign(
            { user: { id: userId.toString(), tokenVersion: 0 } },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
        const user = {
            id: userId.toString(),
            _id: userId,
            tokenVersion: 0,
            refreshToken,
            save: jest.fn()
        };

        User.findById.mockResolvedValueOnce(user);

        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.refreshToken).not.toBe(refreshToken);
        expect(user.refreshToken).toBe(res.body.refreshToken);
        expect(user.save).toHaveBeenCalled();
        expect(res.body.success).toBe(true);
    });

    it('should reject an old refresh token after rotation', async () => {
        const oldRefreshToken = jwt.sign(
            { user: { id: userId.toString(), tokenVersion: 0 } },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        User.findById.mockResolvedValueOnce({
            id: userId.toString(),
            _id: userId,
            tokenVersion: 0,
            refreshToken: 'new-stored-refresh-token'
        });

        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: oldRefreshToken });

        expect(res.status).toBe(401);
        expect(res.body.msg).toBe('Invalid refresh token');
    });

    it('should reject a refresh token with a stale token version', async () => {
        const staleRefreshToken = jwt.sign(
            { user: { id: userId.toString(), tokenVersion: 0 } },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        User.findById.mockResolvedValueOnce({
            id: userId.toString(),
            _id: userId,
            tokenVersion: 1,
            refreshToken: staleRefreshToken
        });

        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: staleRefreshToken });

        expect(res.status).toBe(401);
        expect(res.body.msg).toBe('Refresh token has been revoked');
    });
});
