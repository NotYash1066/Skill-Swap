const request = require('supertest');
const express = require('express');
const { sanitizeInput } = require('../middleware/inputValidation');

describe('Security Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(sanitizeInput);
        app.post('/test', (req, res) => {
            res.json(req.body);
        });
    });

    describe('NoSQL Injection Prevention', () => {
        it('should remove keys starting with $', async () => {
            const res = await request(app)
                .post('/test')
                .send({
                    username: 'user',
                    $where: 'this.password.length > 0'
                });
            
            expect(res.body).toHaveProperty('username');
            expect(res.body).not.toHaveProperty('$where');
        });

        it('should remove nested keys starting with $', async () => {
            const res = await request(app)
                .post('/test')
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
        it('should escape HTML characters in strings', async () => {
            const payload = '<script>alert(1)</script>';
            const res = await request(app)
                .post('/test')
                .send({
                    content: payload
                });
            
            // This is expected to FAIL currently because sanitizeInput doesn't handle XSS
            expect(res.body.content).not.toContain('<script>');
            expect(res.body.content).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
        });
    });
});
