const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const cache = require('../middleware/cache');

// Enhanced potential matches with advanced filters
router.get('/potential-enhanced', auth, cache(300), async (req, res, next) => {
  try {
    const { 
      minRating, 
      timezone, 
      availability, 
      verified, 
      skill,
      location 
    } = req.query;
    
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let query = {
      _id: { $ne: req.user.id },
      skillsOffered: { $in: currentUser.skillsSought || [] },
      skillsSought: { $in: currentUser.skillsOffered || [] }
    };
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    if (availability) {
      query.availability = { $in: availability.split(',') };
    }
    
    if (verified === 'true') {
      const Badge = require('../models/Badge');
      const verifiedUsers = await Badge.distinct('user', { type: { $in: ['verified', 'expert'] } });
      query._id.$in = verifiedUsers;
    }
    
    if (skill) {
      query.skillsOffered = skill;
    }
    
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }
    
    const [recipientIds, requesterIds] = await Promise.all([
      Match.distinct('recipient', { requester: req.user.id }),
      Match.distinct('requester', { recipient: req.user.id })
    ]);
    
    const excludeIds = [...new Set([...recipientIds, ...requesterIds])];
    
    if (excludeIds.length) {
      query._id.$nin = excludeIds;
    }
    
    const matches = await User.find(query)
      .select('username avatar skillsOffered skillsWanted rating location availability')
      .limit(20);
    
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
