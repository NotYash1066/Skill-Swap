const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const ChatRoom = require('../models/ChatRoom');

// @route   GET /api/matches/potential
// @desc    Get potential matches based on complementary skills
// @access  Private
router.get('/potential', auth, async (req, res) => {
  try {
    const { search, skill, minCompatibility = 0 } = req.query;
    const currentUser = await User.findById(req.user.id);
    
    // Build query for finding potential matches
    let matchQuery = {
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: { $ne: false }, // Only active users
      $and: [
        { skillsOffered: { $in: currentUser.skillsSought } },
        { skillsSought: { $in: currentUser.skillsOffered } }
      ]
    };

    // Add username search filter if provided
    if (search && search.trim()) {
      matchQuery.username = { $regex: search.trim(), $options: 'i' };
    }

    // Add specific skill filter if provided
    if (skill && skill.trim()) {
      matchQuery.$or = [
        { skillsOffered: { $regex: skill.trim(), $options: 'i' } },
        { skillsSought: { $regex: skill.trim(), $options: 'i' } }
      ];
    }
    
    const potentialMatches = await User.find(matchQuery)
      .select('username email skillsOffered skillsSought bio createdAt')
      .limit(50); // Limit results for performance

    // Calculate compatibility and matched skills for each potential match
    const matchesWithCompatibility = potentialMatches.map(user => {
      const matchedSkills = [];
      
      // Skills they offer that we want
      const theirOfferedWeWant = user.skillsOffered.filter(skill => 
        currentUser.skillsSought.some(sought => 
          sought.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      // Skills we offer that they want
      const weOfferTheyWant = currentUser.skillsOffered.filter(skill => 
        user.skillsSought.some(sought => 
          sought.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      matchedSkills.push(...theirOfferedWeWant, ...weOfferTheyWant);
      
      // Remove duplicates
      const uniqueMatchedSkills = [...new Set(matchedSkills)];
      
      // Calculate compatibility score (improved algorithm)
      const baseScore = uniqueMatchedSkills.length * 15;
      const mutualMatch = theirOfferedWeWant.length > 0 && weOfferTheyWant.length > 0 ? 20 : 0;
      const compatibilityScore = Math.min(baseScore + mutualMatch, 100);
      
      return {
        ...user.toObject(),
        matchedSkills: uniqueMatchedSkills,
        compatibilityScore
      };
    });

    // Filter by minimum compatibility score if specified
    const filteredMatches = matchesWithCompatibility.filter(match => 
      match.compatibilityScore >= parseInt(minCompatibility)
    );

    // Sort by compatibility score (highest first)
    filteredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(filteredMatches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/matches/request
// @desc    Send a match request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId, message, matchedSkills } = req.body;

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

    // Calculate compatibility score
    const compatibilityScore = matchedSkills.length * 20; // Simple scoring

    const newMatch = new Match({
      requester: req.user.id,
      recipient: recipientId,
      message,
      matchedSkills,
      compatibilityScore
    });

    await newMatch.save();
    await newMatch.populate('requester recipient', 'username email');

    console.log('Match request created:', newMatch);
    res.json(newMatch);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/matches/received
// @desc    Get received match requests
router.get('/received', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('requester', 'username email skillsOffered skillsSought')
      .sort({ createdAt: -1 });

    console.log(`Found ${matches.length} received match requests for user ${req.user.id}`);
    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/matches/sent
// @desc    Get sent match requests
router.get('/sent', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      requester: req.user.id
    }).populate('recipient', 'username email skillsOffered skillsSought')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/matches/:id/respond
// @desc    Respond to a match request (accept/reject)
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    
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
    await match.save();

    // If accepted, create a chat room
    if (status === 'accepted') {
      const ChatRoom = require('../models/ChatRoom');
      
      const chatRoom = new ChatRoom({
        participants: [match.requester, match.recipient],
        match: match._id
      });
      
      await chatRoom.save();
    }

    await match.populate('requester recipient', 'username email');
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/matches/accepted
// @desc    Get accepted matches (connections)
router.get('/accepted', auth, async (req, res) => {
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
