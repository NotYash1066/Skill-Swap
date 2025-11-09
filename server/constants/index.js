module.exports = {
  AVAILABILITY_SLOTS: [
    'weekday_morning',
    'weekday_afternoon', 
    'weekday_evening',
    'weekend_morning',
    'weekend_afternoon',
    'weekend_evening'
  ],
  
  MESSAGE_TYPES: {
    TEXT: 'text',
    SYSTEM: 'system'
  },
  
  MATCH_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
  },
  
  NOTIFICATION_TYPES: {
    MATCH_REQUEST: 'match_request',
    MATCH_ACCEPTED: 'match_accepted',
    MESSAGE: 'message'
  },
  
  LIMITS: {
    MAX_SKILLS: 20,
    MAX_SKILL_LENGTH: 50,
    MAX_BIO_LENGTH: 500,
    MAX_MESSAGE_LENGTH: 5000,
    MAX_MATCH_MESSAGE_LENGTH: 500,
    MAX_PAGINATION: 100,
    DEFAULT_PAGINATION: 50
  }
};
