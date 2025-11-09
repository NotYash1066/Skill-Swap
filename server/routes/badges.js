const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Request verification
router.post('/verify-request', auth, async (req, res, next) => {
  try {
    const { skill, verifierId } = req.body;
    
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
    
    await Notification.create({
      user: verifierId,
      type: 'verification-request',
      message: `${req.user.username} requested skill verification for ${skill}`
    });
    
    res.json({ message: 'Verification request sent' });
  } catch (err) {
    next(err);
  }
});

// Verify skill
router.post('/verify', auth, async (req, res, next) => {
  try {
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
    
    if (badge.verifiedBy.length >= 5) {
      await Badge.findOneAndUpdate(
        { user: userId, skill, type: 'expert' },
        { user: userId, skill, type: 'expert', verifiedBy: badge.verifiedBy },
        { upsert: true }
      );
    }
    
    res.json(badge);
  } catch (err) {
    next(err);
  }
});

// Get user badges
router.get('/user/:userId', async (req, res, next) => {
  try {
    const badges = await Badge.find({ user: req.params.userId })
      .populate('verifiedBy', 'username avatar');
    res.json(badges);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
