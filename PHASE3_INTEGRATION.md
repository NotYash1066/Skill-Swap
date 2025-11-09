# Phase 3 Integration Guide

## Quick Integration (2 minutes)

### Step 1: Add Routes to server.js

Add after existing route imports (around line 87):

```javascript
const sessionsRoutes = require('./routes/sessions');
const badgesRoutes = require('./routes/badges');
const progressRoutes = require('./routes/progress');
const matchesEnhanced = require('./routes/matchesEnhanced');
```

Add after existing route usage (around line 107):

```javascript
app.use('/api/sessions', sessionsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/matches', matchesEnhanced);
```

### Step 2: Restart Server

```bash
cd server && npm run dev
```

### Step 3: Test Endpoints

```bash
# Get your sessions
curl http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get progress
curl http://localhost:5000/api/progress/JavaScript \
  -H "Authorization: Bearer YOUR_TOKEN"

# Advanced search
curl "http://localhost:5000/api/matches/potential-enhanced?minRating=4" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Integration Examples

### Scheduling Component

```javascript
// Schedule a session
const scheduleSession = async (recipientId, skill, scheduledAt, duration) => {
  const { data } = await axios.post('/api/sessions', {
    recipientId,
    skill,
    scheduledAt,
    duration
  });
  return data;
};

// Get upcoming sessions
const getSessions = async () => {
  const { data } = await axios.get('/api/sessions');
  return data;
};

// Update session status
const updateSession = async (sessionId, status) => {
  const { data } = await axios.put(`/api/sessions/${sessionId}`, { status });
  return data;
};
```

### Badge System

```javascript
// Request verification
const requestVerification = async (skill, verifierId) => {
  await axios.post('/api/badges/verify-request', { skill, verifierId });
};

// Verify someone's skill
const verifySkill = async (userId, skill) => {
  const { data } = await axios.post('/api/badges/verify', { userId, skill });
  return data;
};

// Get user badges
const getBadges = async (userId) => {
  const { data } = await axios.get(`/api/badges/user/${userId}`);
  return data;
};
```

### Progress Tracking

```javascript
// Get progress
const getProgress = async (skill) => {
  const { data } = await axios.get(`/api/progress/${skill}`);
  return data;
};

// Add milestone
const addMilestone = async (skill, title, description) => {
  const { data } = await axios.post(`/api/progress/${skill}/milestone`, {
    title,
    description
  });
  return data;
};

// Update after session
const updateProgress = async (skill, duration) => {
  const { data } = await axios.post(`/api/progress/${skill}/session`, {
    duration
  });
  return data;
};
```

### Advanced Filters

```javascript
// Search with filters
const searchMatches = async (filters) => {
  const params = new URLSearchParams(filters);
  const { data } = await axios.get(`/api/matches/potential-enhanced?${params}`);
  return data;
};

// Example usage
const matches = await searchMatches({
  minRating: 4,
  verified: true,
  location: 'New York',
  availability: 'weekday_evening,weekend_morning'
});
```

---

## React Component Examples

### Session Scheduler

```jsx
import { useState } from 'react';
import axios from 'axios';

export default function SessionScheduler({ recipientId, skill }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);

  const handleSchedule = async (e) => {
    e.preventDefault();
    await axios.post('/api/sessions', {
      recipientId,
      skill,
      scheduledAt,
      duration
    });
    alert('Session scheduled!');
  };

  return (
    <form onSubmit={handleSchedule}>
      <input 
        type="datetime-local" 
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        required
      />
      <select value={duration} onChange={(e) => setDuration(e.target.value)}>
        <option value={30}>30 min</option>
        <option value={60}>1 hour</option>
        <option value={90}>1.5 hours</option>
        <option value={120}>2 hours</option>
      </select>
      <button type="submit">Schedule</button>
    </form>
  );
}
```

### Progress Display

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProgressCard({ skill }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    axios.get(`/api/progress/${skill}`)
      .then(res => setProgress(res.data));
  }, [skill]);

  if (!progress) return <div>Loading...</div>;

  return (
    <div className="progress-card">
      <h3>{skill}</h3>
      <div className="level">Level {progress.level}</div>
      <div className="xp-bar">
        <div style={{ width: `${(progress.xp / (progress.level * 100)) * 100}%` }} />
      </div>
      <div className="stats">
        <span>Sessions: {progress.sessionsCompleted}</span>
        <span>Hours: {progress.hoursLearned.toFixed(1)}</span>
      </div>
      <div className="achievements">
        {progress.achievements.map(a => (
          <span key={a.name} title={a.name}>🏆</span>
        ))}
      </div>
    </div>
  );
}
```

### Badge Display

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function BadgeList({ userId }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    axios.get(`/api/badges/user/${userId}`)
      .then(res => setBadges(res.data));
  }, [userId]);

  const badgeIcons = {
    verified: '✓',
    expert: '⭐',
    mentor: '👨‍🏫'
  };

  return (
    <div className="badges">
      {badges.map(badge => (
        <div key={badge._id} className={`badge ${badge.type}`}>
          <span className="icon">{badgeIcons[badge.type]}</span>
          <span className="skill">{badge.skill}</span>
          <span className="count">{badge.verifiedBy.length} verifications</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Test Session Creation

```bash
# Create session
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "673e8f9a1234567890abcdef",
    "skill": "JavaScript",
    "scheduledAt": "2025-11-10T14:00:00Z",
    "duration": 60
  }'

# Get sessions
curl http://localhost:5000/api/sessions \
  -H "Authorization: Bearer TOKEN"
```

### Test Progress Tracking

```bash
# Get progress
curl http://localhost:5000/api/progress/JavaScript \
  -H "Authorization: Bearer TOKEN"

# Complete a session
curl -X POST http://localhost:5000/api/progress/JavaScript/session \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": 60}'

# Add milestone
curl -X POST http://localhost:5000/api/progress/JavaScript/milestone \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Completed React Tutorial",
    "description": "Built first React app"
  }'
```

### Test Badge System

```bash
# Request verification
curl -X POST http://localhost:5000/api/badges/verify-request \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "JavaScript",
    "verifierId": "673e8f9a1234567890abcdef"
  }'

# Get badges
curl http://localhost:5000/api/badges/user/673e8f9a1234567890abcdef
```

---

## Troubleshooting

### Sessions not showing
- Check authorization token
- Verify scheduledAt is in future
- Check user is participant

### Achievements not unlocking
- Verify session completion count
- Check XP calculation
- Ensure progress.save() is called

### Verification failing
- Need 3+ completed sessions
- Check both users exist
- Verify skill name matches

---

## Next Steps

1. ✅ Add routes to server.js
2. ⏳ Test all endpoints
3. ⏳ Build frontend components
4. ⏳ Add session reminders (optional)
5. ⏳ Implement calendar export (optional)

---

**Integration Time**: 2 minutes
**Testing Time**: 5 minutes
**Total**: 7 minutes to full functionality
