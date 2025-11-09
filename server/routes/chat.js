const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Match = require('../models/Match');

// @route   GET /api/chat/rooms
// @desc    Get user's chat rooms
router.get('/rooms', auth, async (req, res) => {
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/chat/rooms/:roomId/messages
// @desc    Get messages for a chat room
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
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
      .limit(limit * 1)
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/chat/rooms/:roomId/messages
// @desc    Send a message
router.post('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ msg: 'Message content is required' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ msg: 'Message too long (max 5000 characters)' });
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/chat/unread
// @desc    Get unread message count for the authenticated user
// @access  Private
router.get('/unread', auth, async (req, res) => {
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/chat/rooms/:roomId/read
// @desc    Mark messages as read in a chat room
// @access  Private
router.put('/rooms/:roomId/read', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
