const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const levenshtein = require('fast-levenshtein');
const auth = require('../middleware/auth');
const { validateObjectId } = require('../middleware/inputValidation');
const User = require('../models/User');
const Match = require('../models/Match');
const ChatRoom = require('../models/ChatRoom');
const { createNotification } = require('../utils/notificationHelper');
const { requestLimiter } = require('../middleware/rateLimit');
const { sanitizeRegexInput } = require('../utils/validators');
const { MATCH_STATUS, LIMITS } = require('../constants');

// Constants for matching
const SIMILARITY_THRESHOLD = 0.8;
const EXACT_MATCH_SCORE = 20;
const FUZZY_MATCH_SCORE = 15;

/**
 * Checks if two skills match (either exactly or fuzzy).
 * @param {string} skill1 - First skill string.
 * @param {string} skill2 - Second skill string.
 * @returns {boolean} - True if they match.
 */
const areSkillsMatching = (skill1, skill2) => {
  const s1 = skill1.toLowerCase().trim();
  const s2 = skill2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return true;

  // Fuzzy match
  const distance = levenshtein.get(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - (distance / maxLength);

  return similarity >= SIMILARITY_THRESHOLD;
};

// @route   GET /api/matches/potential
// @desc    Get potential matches based on complementary skills with fuzzy matching
// @access  Private
router.get('/potential', auth, async (req, res, next) => {
  try {
    const { search, skill, minCompatibility = 0, city, country, availability, minRating } = req.query;
    
    // Sanitize inputs
    const sanitizedCity = sanitizeRegexInput(city);
    const sanitizedCountry = sanitizeRegexInput(country);

    // Get current user and their skills
    const currentUser = await User.findById(req.user.id);
    const userSought = Array.isArray(currentUser?.skillsSought) ? currentUser.skillsSought : [];
    const userOffered = Array.isArray(currentUser?.skillsOffered) ? currentUser.skillsOffered : [];

    // Exclude users you already have any match with (pending/accepted/rejected)
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const existingMatches = await Match.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).select('requester recipient');

    const me = req.user.id.toString();
    const excludeIds = new Set();
    existingMatches.forEach(m => {
      const requester = m.requester.toString();
      const recipient = m.recipient.toString();
      excludeIds.add(requester === me ? recipient : requester);
    });
    const excluded = Array.from(excludeIds);
    
    // Base query: Active users, not me, not already matched
    let matchQuery = {
      _id: { $ne: req.user.id, ...(excluded.length ? { $nin: excluded } : {}) },
      isActive: { $ne: false }
    };

    // Advanced filters
    if (sanitizedCity) matchQuery['location.city'] = { $regex: sanitizedCity, $options: 'i' };
    if (sanitizedCountry) matchQuery['location.country'] = { $regex: sanitizedCountry, $options: 'i' };
    if (availability) matchQuery.availability = { $in: Array.isArray(availability) ? availability : [availability] };
    if (minRating) matchQuery.rating = { $gte: parseFloat(minRating) };

    // Search by username
    if (search && search.trim()) {
      const sanitizedSearch = sanitizeRegexInput(search);
      matchQuery.username = { $regex: sanitizedSearch, $options: 'i' };
    }

    // Search by specific skill (optional filter)
    if (skill && skill.trim()) {
      const sanitizedSkill = sanitizeRegexInput(skill);
      matchQuery.$or = [
        { skillsOffered: { $regex: sanitizedSkill, $options: 'i' } },
        { skillsSought: { $regex: sanitizedSkill, $options: 'i' } }
      ];
    }
    
    // Fetch potential candidates (LIMIT 100 to avoid performance issues with JS filtering)
    const potentialMatches = await User.find(matchQuery)
      .select('username email skillsOffered skillsSought bio avatar location availability proficiency rating reviewCount createdAt')
      .limit(100);

    // Calculate compatibility and matched skills
    const matchesWithCompatibility = potentialMatches.map(user => {
      const otherOffered = Array.isArray(user.skillsOffered) ? user.skillsOffered : [];
      const otherSought = Array.isArray(user.skillsSought) ? user.skillsSought : [];
      const matchedSkills = [];
      let currentCompatibilityScore = 0;

      // 1. Skills they offer that we want
      const theirOfferedWeWant = otherOffered.filter(theirSkill =>
        userSought.some(mySought => areSkillsMatching(mySought, theirSkill))
      );
      
      // 2. Skills we offer that they want
      const weOfferTheyWant = userOffered.filter(myOffered =>
        otherSought.some(theirSought => areSkillsMatching(theirSought, myOffered))
      );
      
      matchedSkills.push(...theirOfferedWeWant, ...weOfferTheyWant);
      
      // Calculate Score
      // Add points for each match
      theirOfferedWeWant.forEach(() => currentCompatibilityScore += EXACT_MATCH_SCORE);
      
      // Add bonus for mutual match (exchange)
      if (theirOfferedWeWant.length > 0 && weOfferTheyWant.length > 0) {
        currentCompatibilityScore += 30; // Bonus for mutual exchange
      }

      // Remove duplicates for display
      const uniqueMatchedSkills = [...new Set(matchedSkills)];
      
      return {
        ...user.toObject(),
        matchedSkills: uniqueMatchedSkills,
        compatibilityScore: Math.min(currentCompatibilityScore, 100)
      };
    });

    // Filter by minimum compatibility score if specified
    // Default: Must have at least one match (>0 score) unless minCompatibility is 0
    const filteredMatches = matchesWithCompatibility.filter(match => {
      // If minCompatibility is explicit, use it. Otherwise ensure at least some match.
      const minScore = minCompatibility ? parseInt(minCompatibility) : 1;
      return match.compatibilityScore >= minScore;
    });

    // Sort by compatibility score (highest first)
    filteredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(filteredMatches);
  } catch (err) {
    return next(err);
  }
});

// @route   POST /api/matches/request
// @desc    Send a match request
router.post('/request', auth, requestLimiter, validateObjectId, async (req, res, next) => {
  try {
    const { recipientId, message, matchedSkills } = req.body;

    // Basic validation
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ msg: 'Invalid recipientId' });
    }
    if (!message || !message.trim() || message.trim().length > LIMITS.MAX_MATCH_MESSAGE_LENGTH) {
      return res.status(400).json({ msg: `Message is required and must be <= ${LIMITS.MAX_MATCH_MESSAGE_LENGTH} characters` });
    }
    if (!Array.isArray(matchedSkills) || matchedSkills.length === 0) {
      return res.status(400).json({ msg: 'matchedSkills must be a non-empty array' });
    }

    // Prevent self-request
    if (recipientId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot send a request to yourself' });
    }

    // Ensure recipient exists
    const recipient = await User.findById(recipientId).select('_id');
    if (!recipient) {
      return res.status(404).json({ msg: 'Recipient not found' });
    }

    // Check if match request already exists
    const existingMatch = await Match.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ msg: 'Match request already exists' });
    }

    // Calculate compatibility score (capped)
    const compatibilityScore = Math.min((matchedSkills?.length || 0) * 20, 100);

    const newMatch = new Match({
      requester: req.user.id,
      recipient: recipientId,
      message: message.trim(),
      matchedSkills,
      compatibilityScore
    });

    await newMatch.save();
    await newMatch.populate('requester recipient', 'username email');

    // Create notification for recipient
    const notification = await createNotification(
      recipientId,
      'match_request',
      `New match request from ${newMatch.requester.username}`,
      message.trim(),
      { matchId: newMatch._id }
    );
    
    // Emit real-time notification via socket
    const io = req.app.get('io');
    if (io) io.to(`notifications-${recipientId}`).emit('new-notification', notification);

    return res.json(newMatch);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ msg: 'A request between these users already exists' });
    }
    return next(err);
  }
});

// @route   GET /api/matches/received
// @desc    Get received match requests
router.get('/received', auth, async (req, res, next) => {
  try {
    const matches = await Match.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('requester', 'username email skillsOffered skillsSought')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    return next(err);
  }
});

// @route   GET /api/matches/sent
// @desc    Get sent match requests
router.get('/sent', auth, async (req, res, next) => {
  try {
    const matches = await Match.find({
      requester: req.user.id
    }).populate('recipient', 'username email skillsOffered skillsSought')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    return next(err);
  }
});

// @route   PUT /api/matches/:id/respond
// @desc    Respond to a match request (accept/reject)
router.put('/:id/respond', auth, validateObjectId, async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    // Only recipient can respond
    if (match.recipient.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ msg: 'Match already responded to' });
    }

    match.status = status;
    match.respondedAt = new Date();
    await match.save();

    // Create notification for requester
    await match.populate('requester recipient', 'username');
    if (status === 'accepted') {
      const notification = await createNotification(
        match.requester._id,
        'match_accepted',
        `${match.recipient.username} accepted your request!`,
        'You can now start chatting',
        { matchId: match._id }
      );
      const io = req.app.get('io');
      if (io) io.to(`notifications-${match.requester._id}`).emit('new-notification', notification);
    }

    // If accepted, ensure a chat room exists (idempotent)
    if (status === 'accepted') {

      // Try to find an existing room by match or by participants (order-independent)
      let chatRoom = await ChatRoom.findOne({
        $or: [
          { match: match._id },
          { participants: { $all: [match.requester, match.recipient] } }
        ]
      });

      if (!chatRoom) {
        chatRoom = new ChatRoom({
          participants: [match.requester, match.recipient],
          match: match._id,
          isActive: true
        });
        await chatRoom.save();
      } else if (chatRoom.isActive === false) {
        chatRoom.isActive = true;
        await chatRoom.save();
      }
    }

    await match.populate('requester recipient', 'username email');
    res.json(match);
  } catch (err) {
    return next(err);
  }
});

// @route   GET /api/matches/accepted
// @desc    Get accepted matches (connections)
router.get('/accepted', auth, async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ],
      status: 'accepted'
    }).populate('requester recipient', 'username email skillsOffered skillsSought')
      .sort({ updatedAt: -1 });

    res.json(matches);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
