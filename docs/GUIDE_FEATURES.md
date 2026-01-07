# Feature Enhancements Implementation Guide

## 2. Feature Enhancements

### 2.1 Scheduling System

**Priority:** HIGH | **Effort:** HIGH | **Impact:** HIGH

**Installation:**
```bash
cd server
npm install node-cron ical-generator
```

**Database Model:**
```javascript
// server/models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['teacher', 'learner'], required: true }
  }],
  skill: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  meetingLink: String,
  notes: String,
  reminder: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

sessionSchema.index({ 'participants.user': 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);

// server/routes/sessions.js
const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const ical = require('ical-generator');

// Create session
router.post('/', auth, async (req, res) => {
  const { recipientId, skill, scheduledAt, duration } = req.body;
  
  const session = await Session.create({
    participants: [
      { user: req.user._id, role: 'teacher' },
      { user: recipientId, role: 'learner' }
    ],
    skill,
    scheduledAt,
    duration
  });

  // Send notification to recipient
  io.to(recipientId).emit('session-scheduled', session);
  
  res.status(201).json(session);
});

// Get user sessions
router.get('/', auth, async (req, res) => {
  const sessions = await Session.find({
    'participants.user': req.user._id,
    scheduledAt: { $gte: new Date() }
  })
  .populate('participants.user', 'username avatar')
  .sort({ scheduledAt: 1 });
  
  res.json(sessions);
});

// Update session status
router.put('/:id', auth, async (req, res) => {
  const session = await Session.findById(req.params.id);
  
  if (!session.participants.some(p => p.user.equals(req.user._id))) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  session.status = req.body.status;
  await session.save();
  
  res.json(session);
});

// Export to calendar
router.get('/:id/calendar', auth, async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('participants.user', 'username email');
  
  const calendar = ical({ name: 'SkillSwap Session' });
  calendar.createEvent({
    start: session.scheduledAt,
    end: new Date(session.scheduledAt.getTime() + session.duration * 60000),
    summary: `SkillSwap: ${session.skill}`,
    description: session.notes,
    location: session.meetingLink,
    organizer: session.participants[0].user.email
  });
  
  res.type('text/calendar').send(calendar.toString());
});

module.exports = router;

// server/utils/scheduler.js - Reminder system
const cron = require('node-cron');
const Session = require('../models/Session');
const Notification = require('../models/Notification');

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  const upcomingSessions = await Session.find({
    scheduledAt: { $gte: now, $lte: oneHourLater },
    status: 'scheduled',
    reminder: true
  }).populate('participants.user');
  
  for (const session of upcomingSessions) {
    for (const participant of session.participants) {
      await Notification.create({
        user: participant.user._id,
        type: 'session-reminder',
        message: `Your session for ${session.skill} starts in 1 hour`,
        relatedId: session._id
      });
      
      io.to(participant.user._id.toString()).emit('notification', {
        type: 'session-reminder',
        session
      });
    }
    
    session.reminder = false;
    await session.save();
  }
});
```

**Frontend Component:**
```javascript
// client/src/components/SessionScheduler.jsx
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
        <option value={30}>30 minutes</option>
        <option value={60}>1 hour</option>
        <option value={90}>1.5 hours</option>
        <option value={120}>2 hours</option>
      </select>
      <button type="submit">Schedule Session</button>
    </form>
  );
}
```

---

### 2.2 Payment Integration (Stripe)

**Priority:** MEDIUM | **Effort:** HIGH | **Impact:** HIGH

**Installation:**
```bash
npm install stripe
```

**Implementation:**
```javascript
// server/config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;

// server/models/User.js - Add fields
stripeCustomerId: String,
isPremium: { type: Boolean, default: false },
premiumExpiresAt: Date

// server/routes/payments.js
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const auth = require('../middleware/auth');

// Create checkout session
router.post('/create-checkout', auth, async (req, res) => {
  const { priceId } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
    metadata: { userId: req.user._id.toString() }
  });
  
  res.json({ sessionId: session.id });
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user = await User.findById(session.metadata.userId);
    
    user.isPremium = true;
    user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    user.stripeCustomerId = session.customer;
    await user.save();
  }
  
  res.json({ received: true });
});

module.exports = router;
```

**Add to .env:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 2.3 Skill Verification & Badges

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** MEDIUM

**Implementation:**
```javascript
// server/models/Badge.js
const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['verified', 'expert', 'mentor', 'achievement'], 
    required: true 
  },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sessionsCompleted: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  earnedAt: { type: Date, default: Date.now }
});

badgeSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model('Badge', badgeSchema);

// server/routes/badges.js
const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Request verification
router.post('/verify-request', auth, async (req, res) => {
  const { skill, verifierId } = req.body;
  
  // Check if verifier has completed sessions with requester
  const completedSessions = await Session.countDocuments({
    'participants.user': { $all: [req.user._id, verifierId] },
    skill,
    status: 'completed'
  });
  
  if (completedSessions < 3) {
    return res.status(400).json({ 
      message: 'Need at least 3 completed sessions for verification' 
    });
  }
  
  // Send verification request notification
  await Notification.create({
    user: verifierId,
    type: 'verification-request',
    message: `${req.user.username} requested skill verification for ${skill}`,
    relatedId: req.user._id
  });
  
  res.json({ message: 'Verification request sent' });
});

// Verify skill
router.post('/verify', auth, async (req, res) => {
  const { userId, skill } = req.body;
  
  let badge = await Badge.findOne({ user: userId, skill, type: 'verified' });
  
  if (!badge) {
    badge = await Badge.create({
      user: userId,
      skill,
      type: 'verified',
      verifiedBy: [req.user._id]
    });
  } else {
    if (!badge.verifiedBy.includes(req.user._id)) {
      badge.verifiedBy.push(req.user._id);
      await badge.save();
    }
  }
  
  // Auto-upgrade to expert after 5 verifications
  if (badge.verifiedBy.length >= 5) {
    await Badge.create({
      user: userId,
      skill,
      type: 'expert',
      verifiedBy: badge.verifiedBy
    });
  }
  
  res.json(badge);
});

// Get user badges
router.get('/user/:userId', async (req, res) => {
  const badges = await Badge.find({ user: req.params.userId })
    .populate('verifiedBy', 'username avatar');
  res.json(badges);
});

module.exports = router;
```

---

### 2.4 Session Recording

**Priority:** LOW | **Effort:** HIGH | **Impact:** MEDIUM

**Installation:**
```bash
npm install @aws-sdk/client-s3 recordrtc
```

**Implementation:**
```javascript
// client/src/hooks/useRecording.js
import { useState, useRef } from 'react';
import RecordRTC from 'recordrtc';
import axios from 'axios';

export default function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);

  const startRecording = async (stream) => {
    recorderRef.current = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm'
    });
    recorderRef.current.startRecording();
    setIsRecording(true);
  };

  const stopRecording = async (sessionId) => {
    return new Promise((resolve) => {
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current.getBlob();
        
        const formData = new FormData();
        formData.append('recording', blob, `session-${sessionId}.webm`);
        formData.append('sessionId', sessionId);
        
        const { data } = await axios.post('/api/recordings/upload', formData);
        setIsRecording(false);
        resolve(data.url);
      });
    });
  };

  return { isRecording, startRecording, stopRecording };
}

// server/routes/recordings.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

router.post('/upload', auth, upload.single('recording'), async (req, res) => {
  const { sessionId } = req.body;
  const key = `recordings/${sessionId}-${Date.now()}.webm`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: req.file.buffer,
    ContentType: 'video/webm'
  }));
  
  const session = await Session.findById(sessionId);
  session.recordingUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  await session.save();
  
  res.json({ url: session.recordingUrl });
});

module.exports = router;
```

---

### 2.5 Progress Tracking & Achievements

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** MEDIUM

**Implementation:**
```javascript
// server/models/Progress.js
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  milestones: [{
    title: String,
    description: String,
    completedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  sessionsCompleted: { type: Number, default: 0 },
  hoursLearned: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  achievements: [{
    name: String,
    icon: String,
    unlockedAt: Date
  }]
});

progressSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model('Progress', progressSchema);

// server/utils/achievements.js
const achievements = [
  { name: 'First Session', xp: 50, condition: (progress) => progress.sessionsCompleted >= 1 },
  { name: 'Dedicated Learner', xp: 100, condition: (progress) => progress.sessionsCompleted >= 5 },
  { name: 'Expert in Training', xp: 200, condition: (progress) => progress.sessionsCompleted >= 10 },
  { name: 'Marathon Learner', xp: 150, condition: (progress) => progress.hoursLearned >= 10 },
  { name: 'Skill Master', xp: 500, condition: (progress) => progress.level >= 5 }
];

const checkAchievements = async (progress) => {
  for (const achievement of achievements) {
    const alreadyUnlocked = progress.achievements.some(a => a.name === achievement.name);
    
    if (!alreadyUnlocked && achievement.condition(progress)) {
      progress.achievements.push({
        name: achievement.name,
        icon: achievement.name.toLowerCase().replace(/\s/g, '-'),
        unlockedAt: new Date()
      });
      progress.xp += achievement.xp;
      
      // Level up logic
      const xpForNextLevel = progress.level * 100;
      if (progress.xp >= xpForNextLevel) {
        progress.level++;
        progress.xp -= xpForNextLevel;
      }
    }
  }
  
  await progress.save();
  return progress;
};

module.exports = { checkAchievements };

// server/routes/progress.js
const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { checkAchievements } = require('../utils/achievements');
const auth = require('../middleware/auth');

// Get user progress
router.get('/:skill', auth, async (req, res) => {
  let progress = await Progress.findOne({ 
    user: req.user._id, 
    skill: req.params.skill 
  });
  
  if (!progress) {
    progress = await Progress.create({
      user: req.user._id,
      skill: req.params.skill
    });
  }
  
  res.json(progress);
});

// Add milestone
router.post('/:skill/milestone', auth, async (req, res) => {
  const progress = await Progress.findOne({ 
    user: req.user._id, 
    skill: req.params.skill 
  });
  
  progress.milestones.push({
    title: req.body.title,
    description: req.body.description,
    completedAt: new Date()
  });
  
  progress.xp += 25;
  await checkAchievements(progress);
  
  res.json(progress);
});

module.exports = router;
```

---

### 2.6 Group Sessions

**Priority:** LOW | **Effort:** HIGH | **Impact:** MEDIUM

**Implementation:**
```javascript
// server/models/Session.js - Update schema
participants: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['host', 'participant'], required: true }
}],
maxParticipants: { type: Number, default: 2 },
isGroup: { type: Boolean, default: false }

// client/src/components/GroupVideoCall.jsx
import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export default function GroupVideoCall({ sessionId, userId }) {
  const [peers, setPeers] = useState({});
  const myVideo = useRef();
  const peerInstance = useRef();

  useEffect(() => {
    const peer = new Peer(userId);
    peerInstance.current = peer;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myVideo.current.srcObject = stream;

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            addVideoStream(call.peer, remoteStream);
          });
        });

        // Join room
        socket.emit('join-session', sessionId, userId);
        
        socket.on('user-connected', (newUserId) => {
          connectToNewUser(newUserId, stream);
        });
      });

    return () => {
      peer.destroy();
    };
  }, []);

  const connectToNewUser = (userId, stream) => {
    const call = peerInstance.current.call(userId, stream);
    call.on('stream', (remoteStream) => {
      addVideoStream(userId, remoteStream);
    });
  };

  const addVideoStream = (userId, stream) => {
    setPeers(prev => ({ ...prev, [userId]: stream }));
  };

  return (
    <div className="video-grid">
      <video ref={myVideo} autoPlay muted />
      {Object.entries(peers).map(([id, stream]) => (
        <Video key={id} stream={stream} />
      ))}
    </div>
  );
}

function Video({ stream }) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current.srcObject = stream;
  }, [stream]);
  
  return <video ref={ref} autoPlay />;
}
```

---

See GUIDE_TECHNICAL.md for technical improvements.
