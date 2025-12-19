const request = require('supertest');
const express = require('express');
const { sanitizeInput, validateObjectId } = require('../middleware/inputValidation');
const mongoose = require('mongoose');

describe('Security Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('ObjectId Validation', () => {
        beforeEach(() => {
            app.get('/test/:id', validateObjectId, (req, res) => res.json({ success: true }));
            app.post('/test', validateObjectId, (req, res) => res.json({ success: true }));
        });

        it('should accept valid ObjectId in params', async () => {
            const validId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/test/${validId}`);
            expect(res.status).toBe(200);
        });

        it('should reject invalid ObjectId in params', async () => {
            const res = await request(app).get('/test/invalid-id');
            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Invalid id');
        });

        it('should accept valid ObjectId in body', async () => {
            const validId = new mongoose.Types.ObjectId();
            const res = await request(app).post('/test').send({ userId: validId });
            expect(res.status).toBe(200);
        });

        it('should reject invalid ObjectId in body', async () => {
            const res = await request(app).post('/test').send({ userId: 'invalid-id' });
            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Invalid userId');
        });
    });

    describe('NoSQL Injection Prevention', () => {
        beforeEach(() => {
             app.use(sanitizeInput);
             app.post('/test-sanitize', (req, res) => res.json(req.body));
        });

        it('should remove keys starting with $', async () => {
            const res = await request(app)
                .post('/test-sanitize')
                .send({
                    username: 'user',
                    $where: 'this.password.length > 0'
                });
            
            expect(res.body).toHaveProperty('username');
            expect(res.body).not.toHaveProperty('$where');
        });

        it('should remove nested keys starting with $', async () => {
            const res = await request(app)
                .post('/test-sanitize')
                .send({
                    data: {
                        $gt: 0
                    }
                });
            
            expect(res.body.data).toEqual({});
            expect(res.body.data).not.toHaveProperty('$gt');
        });
    });

    describe('XSS Prevention', () => {
        beforeEach(() => {
             app.use(sanitizeInput);
             app.post('/test-sanitize', (req, res) => res.json(req.body));
        });

        it('should escape HTML characters in strings', async () => {
            const payload = '<script>alert(1)</script>';
            const res = await request(app)
                .post('/test-sanitize')
                .send({
                    content: payload
                });
            
            expect(res.body.content).not.toContain('<script>');
            expect(res.body.content).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
        });
    });
});
