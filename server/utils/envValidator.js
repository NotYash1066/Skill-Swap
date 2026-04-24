const logger = require('./logger');

const MIN_SECRET_LENGTH = 32;

const requiredEnvVars = [
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'MONGO_URI'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    logger.warn(`JWT_SECRET should be at least ${MIN_SECRET_LENGTH} characters for security`);
  }

  if (process.env.REFRESH_TOKEN_SECRET.length < MIN_SECRET_LENGTH) {
    logger.warn(`REFRESH_TOKEN_SECRET should be at least ${MIN_SECRET_LENGTH} characters for security`);
  }

  if (process.env.REFRESH_TOKEN_SECRET === process.env.JWT_SECRET) {
    logger.error('REFRESH_TOKEN_SECRET must be different from JWT_SECRET');
    process.exit(1);
  }
  
  logger.info('Environment variables validated');
};

module.exports = validateEnv;
