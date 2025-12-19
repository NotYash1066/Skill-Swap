const Notification = require('../models/Notification');
const logger = require('./logger');

const createNotification = async (userId, type, title, body, data = {}) => {
  try {
    if (!userId || !type || !title || !body) {
      logger.warn('createNotification called with missing required fields');
      return null;
    }
    
    const notification = new Notification({ user: userId, type, title, body, data });
    await notification.save();
    return notification;
  } catch (err) {
    logger.error('Error creating notification:', err);
    return null;
  }
};

module.exports = { createNotification };
