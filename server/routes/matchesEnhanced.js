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
    
    const currentUser = await User.findById(req.user._id);
    
    let query = {
      _id: { $ne: req.user._id },
      skillsOffered: { $in: currentUser.skillsWanted },
      skillsWanted: { $in: currentUser.skillsOffered }
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
    
    const existingMatches = await Match.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    }).select('requester recipient');
    
    const excludeIds = existingMatches.map(m => 
      m.requester.equals(req.user._id) ? m.recipient : m.requester
    );
    
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
