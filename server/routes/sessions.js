const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Create session
router.post('/', auth, async (req, res, next) => {
  try {
    const { recipientId, skill, scheduledAt, duration } = req.body;
    
    const session = await Session.create({
      participants: [
        { user: req.user._id, role: 'teacher' },
        { user: recipientId, role: 'learner' }
      ],
      skill,
      scheduledAt,
      duration: duration || 60
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// Get user sessions
router.get('/', auth, async (req, res, next) => {
  try {
    const sessions = await Session.find({
      'participants.user': req.user._id,
      scheduledAt: { $gte: new Date() }
    })
    .populate('participants.user', 'username avatar')
    .sort({ scheduledAt: 1 });
    
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// Update session status
router.put('/:id', auth, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isParticipant = session.participants.some(p => p.user.equals(req.user._id));
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    session.status = req.body.status;
    if (req.body.notes) session.notes = req.body.notes;
    await session.save();
    
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// Delete session
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isParticipant = session.participants.some(p => p.user.equals(req.user._id));
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await session.deleteOne();
    res.json({ message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
