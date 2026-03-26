const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware Error Handling', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      header: jest.fn().mockReturnValue('Bearer dummy_token')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  it('should return 401 with "Token expired" when jwt.verify throws TokenExpiredError', async () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('dummy_token', process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: ['Token expired'] });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Invalid token" when jwt.verify throws JsonWebTokenError', async () => {
    const error = new Error('invalid token');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('dummy_token', process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: ['Invalid token'] });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Authentication failed" for other errors', async () => {
    const error = new Error('Something went wrong');
    error.name = 'SomeOtherError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('dummy_token', process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: ['Authentication failed'] });
    expect(next).not.toHaveBeenCalled();
  });
});
