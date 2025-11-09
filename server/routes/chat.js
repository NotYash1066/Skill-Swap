const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { validateObjectId } = require('../middleware/inputValidation');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Match = require('../models/Match');
const { isValidObjectId } = require('../utils/validators');
const { LIMITS } = require('../constants');

// @route   GET /api/chat/rooms
// @desc    Get user's chat rooms
router.get('/rooms', auth, async (req, res, next) => {
  try {
    const chatRooms = await ChatRoom.find({
      participants: req.user.id,
      isActive: true
    }).populate('participants', 'username email')
      .populate('lastMessage')
      .populate('match')
      .sort({ lastActivity: -1 });

    res.json(chatRooms);
  } catch (err) {
    return next(err);
  }
});

// @route   GET /api/chat/rooms/:roomId/messages
// @desc    Get messages for a chat room
router.get('/rooms/:roomId/messages', auth, validateObjectId, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.roomId)) {
      return res.status(400).json({ msg: 'Invalid room ID' });
    }
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    
    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(req.params.roomId);
    const isParticipant = chatRoom && chatRoom.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const messages = await Message.find({
      chatRoom: req.params.roomId
    }).populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        chatRoom: req.params.roomId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true }
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (err) {
    return next(err);
  }
});

// @route   POST /api/chat/rooms/:roomId/messages
// @desc    Send a message
router.post('/rooms/:roomId/messages', auth, validateObjectId, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.roomId)) {
      return res.status(400).json({ msg: 'Invalid room ID' });
    }
    
    const { content } = req.body;
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ msg: 'Message content is required' });
    }
    
    if (content.length > LIMITS.MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ msg: `Message too long (max ${LIMITS.MAX_MESSAGE_LENGTH} characters)` });
    }
    
    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(req.params.roomId);
    const isParticipant = chatRoom && chatRoom.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const message = new Message({
      chatRoom: req.params.roomId,
      sender: req.user.id,
      content
    });

    await message.save();
    await message.populate('sender', 'username');

    // Update chat room's last activity and last message
    chatRoom.lastActivity = new Date();
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    res.json(message);
  } catch (err) {
    return next(err);
  }
});

// @route   GET /api/chat/unread
// @desc    Get unread message count for the authenticated user
// @access  Private
router.get('/unread', auth, async (req, res, next) => {
  try {
    // Get all chat rooms for the user
    const chatRooms = await ChatRoom.find({
      participants: req.user.id
    });

    const roomIds = chatRooms.map(room => room._id);

    // Count unread messages (messages not in readBy array for this user)
    const unreadCount = await Message.countDocuments({
      chatRoom: { $in: roomIds },
      sender: { $ne: req.user.id }, // Don't count own messages
      'readBy.user': { $ne: req.user.id } // Not marked as read by this user
    });

    res.json({ unreadCount });
  } catch (err) {
    return next(err);
  }
});

// @route   PUT /api/chat/rooms/:roomId/read
// @desc    Mark messages as read in a chat room
// @access  Private
router.put('/rooms/:roomId/read', auth, validateObjectId, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ msg: 'Invalid room ID' });
    }

    // Verify user is participant in this room
    const chatRoom = await ChatRoom.findById(roomId);
    const isParticipant = chatRoom && chatRoom.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Mark all unread messages in this room as read
    await Message.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
