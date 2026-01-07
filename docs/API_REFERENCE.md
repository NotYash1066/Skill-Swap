# SkillSwap API Reference - New Endpoints

## Authentication Extensions

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newPassword123"
}
```

### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

## Sessions

### Create Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "participants": [
    { "user": "userId1", "role": "teacher" },
    { "user": "userId2", "role": "learner" }
  ],
  "skill": "JavaScript",
  "scheduledTime": "2024-11-15T10:00:00Z",
  "duration": 60
}
```

### Get User Sessions
```http
GET /api/sessions
Authorization: Bearer <token>
```

### Update Session
```http
PUT /api/sessions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

### Cancel Session
```http
DELETE /api/sessions/:id
Authorization: Bearer <token>
```

## Badges & Verification

### Verify Skill
```http
POST /api/badges/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "userId",
  "skill": "JavaScript",
  "type": "verified"
}
```

### Get User Badges
```http
GET /api/badges/:userId
```

### Get Verification Stats
```http
GET /api/badges/:userId/stats
```

## Progress Tracking

### Get User Progress
```http
GET /api/progress/:userId
```

### Update Progress
```http
POST /api/progress/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "userId",
  "xpGained": 50,
  "action": "session_completed"
}
```

### Get Achievements
```http
GET /api/progress/:userId/achievements
```

## Enhanced Matches

### Advanced Filtering
```http
GET /api/matches/enhanced?minRating=4&verified=true&skill=JavaScript&location=USA
Authorization: Bearer <token>
```

Query Parameters:
- `minRating` - Minimum user rating (1-5)
- `verified` - Only verified users (true/false)
- `skill` - Filter by specific skill
- `location` - Filter by location
- `availability` - Filter by availability

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Achievement Types

1. **First Session** (50 XP) - Complete your first session
2. **Dedicated Learner** (100 XP) - Complete 10 sessions
3. **Expert in Training** (200 XP) - Get verified in 3 skills
4. **Marathon Learner** (150 XP) - Complete 5 sessions in one day
5. **Skill Master** (500 XP) - Reach expert level in any skill

## Badge Types

- `verified` - Basic skill verification
- `expert` - Expert level (5+ verifications)
- `mentor` - Mentor status

## Session Status

- `scheduled` - Session is scheduled
- `in-progress` - Session is ongoing
- `completed` - Session finished successfully
- `cancelled` - Session was cancelled

## XP System

- Level up every 100 XP
- XP gained from:
  - Completing sessions
  - Getting verified
  - Earning achievements
  - Teaching others
