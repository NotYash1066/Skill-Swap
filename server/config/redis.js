const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  if (!process.env.REDIS_HOST) {
    logger.info('Redis not configured, skipping connection');
    return null;
  }

  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    client.on('error', (err) => logger.error('Redis error:', err));
    client.on('connect', () => logger.info('Redis connected'));

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    return null;
  }
};

const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };
