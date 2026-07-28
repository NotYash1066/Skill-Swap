const logger = require('../utils/logger');
const validateEnv = require('../utils/envValidator');

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Environment validation', () => {
  const originalEnv = process.env;
  let exitSpy;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.REFRESH_TOKEN_SECRET = 'b'.repeat(32);
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    exitSpy.mockRestore();
  });

  it('requires REFRESH_TOKEN_SECRET', () => {
    delete process.env.REFRESH_TOKEN_SECRET;

    expect(() => validateEnv()).toThrow('process.exit');
    expect(logger.error).toHaveBeenCalledWith('Missing required environment variables: REFRESH_TOKEN_SECRET');
  });

  it('rejects matching access and refresh token secrets', () => {
    process.env.REFRESH_TOKEN_SECRET = process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow('process.exit');
    expect(logger.error).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET must be different from JWT_SECRET');
  });

  it('warns when secrets are shorter than recommended', () => {
    process.env.JWT_SECRET = 'short-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'short-refresh-secret';

    validateEnv();

    expect(logger.warn).toHaveBeenCalledWith('JWT_SECRET should be at least 32 characters for security');
    expect(logger.warn).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET should be at least 32 characters for security');
    expect(logger.info).toHaveBeenCalledWith('Environment variables validated');
  });
});
