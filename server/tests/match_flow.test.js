const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../testApp');
const User = require('../models/User');
const Match = require('../models/Match');
const ChatRoom = require('../models/ChatRoom');
const jwt = require('jsonwebtoken');
const dbHelper = require('./db_helper');

describe('Match Flow', () => {
  let user1, user2;
  let token1, token2;
  let u1Id, u2Id;

  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();

    // Create User 1
    user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
      skillsOffered: ['Coding'],
      skillsSought: ['Design']
    });
    u1Id = user1._id;
    token1 = jwt.sign({ user: { id: u1Id } }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Create User 2
    user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
      skillsOffered: ['Design'],
      skillsSought: ['Coding']
    });
    u2Id = user2._id;
    token2 = jwt.sign({ user: { id: u2Id } }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  describe('POST /api/matches/request', () => {
    it('should create a match request', async () => {
      const res = await request(app)
        .post('/api/matches/request')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipientId: u2Id,
          message: 'Let swap skills',
          matchedSkills: ['Coding', 'Design']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('pending');
      expect(res.body.requester._id.toString()).toBe(u1Id.toString());
      expect(res.body.recipient._id.toString()).toBe(u2Id.toString());
    });

    it('should prevent self-request', async () => {
      const res = await request(app)
        .post('/api/matches/request')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipientId: u1Id,
          message: 'Self',
          matchedSkills: ['Coding']
        });

      expect(res.statusCode).toBe(400);
    });

    it('should prevent duplicate request', async () => {
      await Match.create({
        requester: u1Id,
        recipient: u2Id,
        message: 'First',
        matchedSkills: ['Coding']
      });

      const res = await request(app)
        .post('/api/matches/request')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipientId: u2Id,
          message: 'Second',
          matchedSkills: ['Coding']
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Match Response Flow', () => {
    let matchId;

    beforeEach(async () => {
      const match = await Match.create({
        requester: u1Id,
        recipient: u2Id,
        message: 'Hi',
        matchedSkills: ['Coding']
      });
      matchId = match._id;
    });

    it('should list received matches for recipient', async () => {
      const res = await request(app)
        .get('/api/matches/received')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id.toString()).toBe(matchId.toString());
    });

    it('should allow recipient to accept match', async () => {
      const res = await request(app)
        .put(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('accepted');

      // Verify ChatRoom created
      const room = await ChatRoom.findOne({ match: matchId });
      expect(room).toBeTruthy();
      expect(room.participants.map(p => p.toString())).toContain(u1Id.toString());
      expect(room.participants.map(p => p.toString())).toContain(u2Id.toString());
    });

    it('should prevent requester from accepting', async () => {
      const res = await request(app)
        .put(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(403);
    });
  });
});