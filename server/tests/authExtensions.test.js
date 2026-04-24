const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../testApp');
const User = require('../models/User');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

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

    it('should return 200 even for non-existent user (Security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.msg).toContain('If an account exists');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.statusCode).toBe(401);
    });

    it('should require refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/reset-password/:resettoken', () => {
    it('should reset password and revoke the stored refresh token', async () => {
      const rawResetToken = 'valid-reset-token';
      const resetPasswordToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      const user = await User.create({
        username: 'resetuser',
        email: 'reset@example.com',
        password: 'hashedpassword',
        resetPasswordToken,
        resetPasswordExpire: new Date(Date.now() + 5 * 60 * 1000),
        refreshToken: 'persisted-refresh-token',
        tokenVersion: 0
      });

      const res = await request(app)
        .put(`/api/auth/reset-password/${rawResetToken}`)
        .send({ password: 'NewPassword1' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
      expect(updatedUser.tokenVersion).toBe(1);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
    });
  });
});
