const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../testApp');
const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const dbHelper = require('./db_helper');

describe('Notification Routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();

    // Create user and token
    const user = await User.create({
      username: 'notifuser',
      email: 'notif@example.com',
      password: 'password123'
    });
    userId = user._id;
    
    const payload = { user: { id: user.id } };
    token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', async () => {
      await Notification.create({
        user: userId,
        type: 'message',
        title: 'Test Notif',
        body: 'Hello'
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Test Notif');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notif = await Notification.create({
        user: userId,
        type: 'message',
        title: 'Test Notif',
        body: 'Hello',
        read: false
      });

      const res = await request(app)
        .put(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.read).toBe(true);
    });

    it('should return 404 if notification not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await Notification.create([
        { user: userId, type: 'message', title: 'N1', body: 'M1', read: false },
        { user: userId, type: 'match_request', title: 'N2', body: 'M2', read: false }
      ]);

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      const count = await Notification.countDocuments({ user: userId, read: false });
      expect(count).toBe(0);
    });
  });
});