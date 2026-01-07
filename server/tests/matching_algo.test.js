const request = require('supertest');
const express = require('express');
const matchRoutes = require('../routes/matches');
const User = require('../models/User');
const Match = require('../models/Match');
const mongoose = require('mongoose');

const MOCK_USER_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_ID_2 = new mongoose.Types.ObjectId().toString();

jest.mock('../models/User');
jest.mock('../models/Match');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011" }; // Hardcoded valid ObjectId
    next();
});

describe('Matching Algorithm', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/matches', matchRoutes);
        
        // Mock User.findById for current user
        User.findById.mockResolvedValue({
            _id: MOCK_USER_ID,
            skillsSought: ['JavaScript'],
            skillsOffered: ['Python']
        });
        
        // Mock Match.find (existing matches)
        Match.find.mockReturnValue({
            select: jest.fn().mockResolvedValue([])
        });
    });

    it('should not match subsets of strings incorrectly (e.g. Java inside JavaScript)', async () => {
        User.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                    {
                        _id: OTHER_ID,
                        username: 'JavaDev',
                        skillsOffered: ['Java'],
                        skillsSought: [],
                        toObject: () => ({
                            _id: OTHER_ID,
                            username: 'JavaDev',
                            skillsOffered: ['Java'],
                            skillsSought: []
                        })
                    }
                ])
            })
        });

        const res = await request(app).get('/api/matches/potential');
        
        expect(res.status).toBe(200);
        
        const match = res.body.find(m => m.username === 'JavaDev');
        // Since we filter out matches with < 1 compatibility score by default,
        // a non-match should effectively result in the user not being in the list.
        expect(match).toBeUndefined();
    });

    it('should match exact skills case-insensitively', async () => {
        User.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                    {
                        _id: OTHER_ID_2,
                        username: 'JsDev',
                        skillsOffered: ['javascript'],
                        skillsSought: [],
                        toObject: () => ({
                            _id: OTHER_ID_2,
                            username: 'JsDev',
                            skillsOffered: ['javascript'],
                            skillsSought: []
                        })
                    }
                ])
            })
        });

        const res = await request(app).get('/api/matches/potential');
        expect(res.body[0].compatibilityScore).toBeGreaterThan(0);
        expect(res.body[0].matchedSkills).toContain('javascript');
    });
});
