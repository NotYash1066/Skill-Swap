const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    logger.info('Redis not configured, skipping connection');
    return null;
  }

  try {
    let redisConfig;
    if (process.env.REDIS_URL) {
      // Use full URL (preferred for Railway managed Redis with auth)
      redisConfig = { url: process.env.REDIS_URL };
    } else {
      // Fallback for local or basic config
      const username = process.env.REDISUSER || process.env.REDIS_USER || 'default';
      const password = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || '';
      redisConfig = {
        username,
        password,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        }
      };
    }

    client = redis.createClient(redisConfig);

    client.on('error', (err) => logger.error('Redis error:', err));
    client.on('connect', () => logger.info('Redis connected'));
    client.on('ready', () => logger.info('Redis ready'));

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    return null;
  }
};

const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };
