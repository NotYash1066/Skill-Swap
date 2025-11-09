const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { validateObjectId } = require('../middleware/inputValidation');
const Review = require('../models/Review');
const User = require('../models/User');
const Match = require('../models/Match');

// Create review
router.post('/', auth, apiLimiter, validateObjectId, async (req, res, next) => {
  try {
    const { revieweeId, matchId, rating, comment } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(revieweeId) || !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ msg: 'Invalid ID format' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const match = await Match.findOne({
      _id: matchId,
      status: 'accepted',
      $or: [
        { requester: mongoose.Types.ObjectId(req.user.id) },
        { recipient: mongoose.Types.ObjectId(req.user.id) }
      ]
    });
    
    if (!match) return res.status(404).json({ msg: 'Match not found or not accepted' });

    const review = new Review({
      reviewer: req.user.id,
      reviewee: revieweeId,
      match: matchId,
      rating,
      comment: comment?.trim() || ''
    });

    await review.save();

    // Update reviewee's rating
    const reviews = await Review.find({ reviewee: revieweeId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, { rating: avgRating, reviewCount: reviews.length });

    res.json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ msg: 'You already reviewed this user' });
    return next(err);
  }
});

// Get user reviews
router.get('/user/:userId', auth, validateObjectId, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }
    const reviews = await Review.find({ 
      reviewee: mongoose.Types.ObjectId(req.params.userId) 
    }).populate('reviewer', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(reviews);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
