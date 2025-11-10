const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../testApp');
const User = require('../models/User');

describe('Auth Extensions', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/SkillSwapTestDB');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  }, 15000);

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.statusCode).toBe(403);
    });

    it('should require refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.statusCode).toBe(401);
    });
  });
});
