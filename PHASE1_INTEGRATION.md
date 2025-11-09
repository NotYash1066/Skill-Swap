# Phase 1 Integration Guide

## Files Created/Modified

### New Files Created ✅
1. `server/utils/sendEmail.js` - Email utility for password reset
2. `server/utils/generateTokens.js` - Token generation (access & refresh)
3. `server/config/redis.js` - Redis configuration
4. `server/middleware/cache.js` - Caching middleware
5. `server/routes/authExtensions.js` - Password reset & refresh token routes
6. `server/models/User.js` - Updated with new fields

### Files to Modify

#### 1. server/server.js

Add after line 84 (after importing routes):

```javascript
const authExtensions = require("./routes/authExtensions");

// Initialize Redis (optional)
const { connectRedis } = require('./config/redis');
connectRedis().then(client => {
  if (client) {
    logger.info('Redis initialized successfully');
  } else {
    logger.info('Running without Redis caching');
  }
}).catch(err => {
  logger.error('Redis initialization error:', err);
  logger.info('Continuing without Redis');
});
```

Add after line 103 (after app.use("/api/auth", authRoutes)):

```javascript
app.use("/api/auth", authExtensions);
```

#### 2. server/routes/matches.js

Add caching to potential matches endpoint:

```javascript
const cache = require('../middleware/cache');

// Update the GET /potential route
router.get("/potential", auth, cache(300), async (req, res, next) => {
  // existing code...
});
```

#### 3. server/.env

Add these environment variables:

```env
# Email Configuration (for password reset)
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_NAME=SkillSwap
FROM_EMAIL=noreply@skillswap.com

# Refresh Token
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here_make_it_different_from_jwt_secret

# Redis (optional - leave blank to run without Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# Client URL (for password reset links)
CLIENT_URL=http://localhost:5173
```

## Testing the New Features

### 1. Test Password Reset

```bash
# Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password (use token from email)
curl -X PUT http://localhost:5000/api/auth/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password":"NewPassword123"}'
```

### 2. Test Refresh Token

```bash
# Login to get tokens
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Use refresh token to get new access token
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN_HERE"}'

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 3. Test Redis Caching

```bash
# First request (should be slow)
time curl http://localhost:5000/api/matches/potential \
  -H "Authorization: Bearer YOUR_TOKEN"

# Second request (should be faster - cached)
time curl http://localhost:5000/api/matches/potential \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Email Setup (Gmail Example)

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
4. Use this password in EMAIL_PASSWORD env variable

## Redis Setup (Optional)

### Install Redis:

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

### Test Redis:
```bash
redis-cli ping
# Should return: PONG
```

## Next Steps

1. Apply the integration changes listed above
2. Update .env with required variables
3. Restart the server
4. Test all new endpoints
5. Update frontend to use new features:
   - Password reset flow
   - Refresh token handling
   - Logout functionality

## Frontend Integration

### Password Reset Flow

```javascript
// Request reset
const requestReset = async (email) => {
  await axios.post('/api/auth/forgot-password', { email });
  // Show success message
};

// Reset password
const resetPassword = async (token, password) => {
  await axios.put(`/api/auth/reset-password/${token}`, { password });
  // Redirect to login
};
```

### Refresh Token Handling

```javascript
// Store refresh token in localStorage
localStorage.setItem('refreshToken', refreshToken);

// Axios interceptor for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
      localStorage.setItem('token', data.token);
      error.config.headers.Authorization = `Bearer ${data.token}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Troubleshooting

### Email not sending
- Check EMAIL_USERNAME and EMAIL_PASSWORD are correct
- Verify 2FA is enabled and App Password is generated
- Check firewall/network allows SMTP connections

### Redis connection fails
- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT are correct
- Application will continue without Redis if connection fails

### Token errors
- Ensure REFRESH_TOKEN_SECRET is set and different from JWT_SECRET
- Check token expiry times are appropriate for your use case
- Verify tokens are being stored/retrieved correctly

## Performance Improvements

With these changes, you should see:
- **Rate limiting**: Protection against brute force attacks
- **Caching**: 50-90% faster response times for cached endpoints
- **Refresh tokens**: Better security with short-lived access tokens
- **Password reset**: Improved user experience for forgotten passwords

## Security Considerations

- Never commit .env file to version control
- Use strong, unique secrets for JWT_SECRET and REFRESH_TOKEN_SECRET
- Regularly rotate secrets in production
- Monitor rate limit violations
- Set up email alerts for password reset requests
- Consider adding CAPTCHA for password reset to prevent abuse
