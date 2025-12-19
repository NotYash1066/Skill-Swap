const request = require('supertest');
const express = require('express');
const errorHandler = require('../middleware/error');
const mongoose = require('mongoose');

// Setup a minimal app for testing error middleware
const app = express();
app.use(express.json());

// Routes to trigger errors
app.get('/error/sync', (req, res) => {
  throw new Error('Sync Error');
});

app.get('/error/async', async (req, res, next) => {
  try {
    throw new Error('Async Error');
  } catch (err) {
    next(err);
  }
});

app.get('/error/validation', (req, res, next) => {
  const err = new Error('Validation Error');
  err.name = 'ValidationError';
  err.errors = {
    field: { kind: 'required', path: 'field' }
  };
  next(err);
});

app.get('/error/duplicate', (req, res, next) => {
  const err = new Error('Duplicate Key');
  err.code = 11000;
  err.keyValue = { email: 'test@test.com' };
  next(err);
});

app.get('/error/cast', (req, res, next) => {
  const err = new Error('Cast Error');
  err.name = 'CastError';
  next(err);
});

app.use(errorHandler);

describe('Error Handling Middleware', () => {
  it('should handle synchronous errors (500)', async () => {
    // Note: Express 5 handles sync errors automatically, but Express 4 needs them caught or strictly in middleware?
    // Actually Express catch sync errors in route handlers.
    const res = await request(app).get('/error/sync');
    expect(res.statusCode).toBe(500);
    expect(res.body.errors[0]).toBe('Internal server error'); // Assuming NODE_ENV != development
  });

  it('should handle asynchronous errors (500)', async () => {
    const res = await request(app).get('/error/async');
    expect(res.statusCode).toBe(500);
  });

  it('should handle Mongoose validation errors (400)', async () => {
    const res = await request(app).get('/error/validation');
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe('field is required');
  });

  it('should handle duplicate key errors (400)', async () => {
    const res = await request(app).get('/error/duplicate');
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toContain('already taken');
  });

  it('should handle CastError (400)', async () => {
    const res = await request(app).get('/error/cast');
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe('Invalid resource ID');
  });
});
