const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const cache = (duration = 300) => async (req, res, next) => {
  const redisClient = getRedisClient();
  
  if (!redisClient || !redisClient.isOpen) {
    return next();
  }

  const key = `cache:${req.originalUrl || req.url}`;
  
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      logger.info(`Cache hit for ${key}`);
      return res.json(JSON.parse(cached));
    }
    
    res.originalJson = res.json;
    res.json = function(data) {
      redisClient.setEx(key, duration, JSON.stringify(data)).catch(err => 
        logger.error('Redis setEx error:', err)
      );
      res.originalJson(data);
    };
    next();
  } catch (err) {
    logger.error('Cache middleware error:', err);
    next();
  }
};

module.exports = cache;
