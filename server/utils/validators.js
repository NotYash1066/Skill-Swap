const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

const sanitizeRegexInput = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[^a-zA-Z0-9\s\-]/g, '');
};

module.exports = {
  isValidObjectId,
  sanitizeString,
  sanitizeRegexInput
};
