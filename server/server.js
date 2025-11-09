require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const logger = require('./utils/logger');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const { createNotification } = require('./utils/notificationHelper');

// Fail fast if critical env vars are missing
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not defined. Please set it in your environment or .env file.");
  process.exit(1);
}

const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false
}));
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Debug middleware
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

// Root route handler
app.get("/", (req, res) => {
	res.json({ message: "Welcome to SkillSwap API" });
});
// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/SkillSwapDB')
  .then(() => logger.info('MongoDB connected successfully'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import routes
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matches");
const chatRoutes = require("./routes/chat");
const notificationRoutes = require("./routes/notifications");
const reviewRoutes = require("./routes/reviews");

// Import video handler
const videoHandler = require("./socketHandlers/videoHandler");

// Import middleware
const errorHandler = require("./middleware/error");
const { apiLimiter } = require("./middleware/rateLimit");

// Apply general rate limiting to all API routes
app.use("/api", apiLimiter);

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

// Debug route to verify server is working
app.get("/api/test", (req, res) => {
	res.json({ message: "Test route working" });
});

// Error handling middleware
app.use(errorHandler);

// Make io accessible to routes
app.set('io', io);

// Initialize handlers
const videoHandlerInstance = videoHandler(io);
const whiteboardHandler = require("./socketHandlers/whiteboardHandler");
const whiteboardHandlerInstance = whiteboardHandler(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join user to their chat rooms
  socket.on('join-rooms', async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) return;
      const userRooms = await ChatRoom.find({
        participants: userId,
        isActive: true
      });
      
      userRooms.forEach(room => {
        socket.join(room._id.toString());
      });
    } catch (err) {
      logger.error('Error joining rooms:', err);
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { roomId, content, senderId } = data;
      if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(senderId)) return;
      if (!content || typeof content !== 'string' || content.length > 5000) return;

      // Create and save message
      const message = new Message({
        chatRoom: roomId,
        sender: senderId,
        content
      });

      await message.save();
      await message.populate('sender', 'username');

      // Update chat room
      const chatRoom = await ChatRoom.findById(roomId).populate('participants', '_id username');
      chatRoom.lastActivity = new Date();
      chatRoom.lastMessage = message._id;
      await chatRoom.save();

      // Emit message to all users in the room
      io.to(roomId).emit('new-message', message);

      // Create notification for recipient
      const recipient = chatRoom.participants.find(p => p._id.toString() !== senderId);
      if (recipient) {
        const notification = await createNotification(
          recipient._id,
          'message',
          `New message from ${message.sender.username}`,
          content.substring(0, 100),
          { roomId, messageId: message._id }
        );
        io.to(`notifications-${recipient._id}`).emit('new-notification', notification);
      }
    } catch (err) {
      logger.error('Error sending message:', err);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.roomId).emit('user-stop-typing', {
      userId: data.userId
    });
  });

  // Join user's notification room
  socket.on('join-notifications', (userId) => {
    socket.join(`notifications-${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
