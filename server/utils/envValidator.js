const logger = require('./logger');

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters for security');
  }
  
  logger.info('Environment variables validated');
};

module.exports = validateEnv;
