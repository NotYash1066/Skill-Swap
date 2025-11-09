const sanitizeHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeHtml(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    sanitized[key] = sanitizeObject(obj[key]);
  }
  
  return sanitized;
};

module.exports = {
  sanitizeHtml,
  sanitizeObject
};
