const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const achievements = [
  { name: 'First Session', xp: 50, condition: (p) => p.sessionsCompleted >= 1 },
  { name: 'Dedicated Learner', xp: 100, condition: (p) => p.sessionsCompleted >= 5 },
  { name: 'Expert in Training', xp: 200, condition: (p) => p.sessionsCompleted >= 10 },
  { name: 'Marathon Learner', xp: 150, condition: (p) => p.hoursLearned >= 10 },
  { name: 'Skill Master', xp: 500, condition: (p) => p.level >= 5 }
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

// Get user progress
router.get('/:skill', auth, async (req, res, next) => {
  try {
    let progress = await Progress.findOne({ 
      user: req.user.id, 
      skill: req.params.skill 
    });
    
    if (!progress) {
      progress = await Progress.create({
        user: req.user.id,
        skill: req.params.skill
      });
    }
    
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

// Add milestone
router.post('/:skill/milestone', auth, async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }
    
    const progress = await Progress.findOne({ 
      user: req.user.id, 
      skill: req.params.skill 
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }
    
    progress.milestones.push({
      title,
      description: description || '',
      completedAt: new Date()
    });
    
    progress.xp += 25;
    await checkAchievements(progress);
    
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

// Update session stats
router.post('/:skill/session', auth, async (req, res, next) => {
  try {
    let progress = await Progress.findOne({ 
      user: req.user.id, 
      skill: req.params.skill 
    });
    
    if (!progress) {
      progress = await Progress.create({
        user: req.user.id,
        skill: req.params.skill
      });
    }
    
    progress.sessionsCompleted += 1;
    progress.hoursLearned += (req.body.duration || 60) / 60;
    progress.xp += 50;
    
    await checkAchievements(progress);
    
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
