const Notification = require('../models/Notification');

const createNotification = async (userId, type, title, body, data = {}) => {
  try {
    const notification = new Notification({ user: userId, type, title, body, data });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

module.exports = { createNotification };
