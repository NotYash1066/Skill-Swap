require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const logger = require('./utils/logger');
const validateEnv = require('./utils/envValidator');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const { createNotification } = require('./utils/notificationHelper');

// Validate environment variables
validateEnv();

const helmet = require('helmet');
const { sanitizeInput } = require('./middleware/inputValidation');
const validateContentType = require('./middleware/contentType');
const requestLogger = require('./middleware/requestLogger');
const timeout = require('./middleware/timeout');
const compression = require('compression');

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
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
app.use(express.urlencoded({ extended: true })); // Add urlencoded support
app.use(compression()); // Enable gzip compression
app.use('/uploads', express.static('uploads'));
app.use(timeout(30));
app.use(requestLogger);
app.use(validateContentType);
app.use(sanitizeInput);



// Root route handler
app.get("/", (req, res) => {
	res.json({ message: "Welcome to SkillSwap API" });
});

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Connect to Database
connectDB();

// Connect to Redis (non-blocking, app works without it for cache etc.)
connectRedis().catch(err => logger.error('Failed to connect to Redis (non-fatal):', err.message));

// Import routes
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matches");
const chatRoutes = require("./routes/chat");
const notificationRoutes = require("./routes/notifications");
const reviewRoutes = require("./routes/reviews");
const authExtensionsRoutes = require("./routes/authExtensions");
const sessionsRoutes = require("./routes/sessions");
const badgesRoutes = require("./routes/badges");
const progressRoutes = require("./routes/progress");
const matchesEnhancedRoutes = require("./routes/matchesEnhanced");
const iceServersRoutes = require("./routes/iceServers");

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
app.use("/api/auth", authExtensionsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/matches", matchesEnhancedRoutes);
app.use("/api/ice-servers", iceServersRoutes);

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
      if (!mongoose.isValidObjectId(userId)) return;
      const userRooms = await ChatRoom.find({
        participants: userId,
        isActive: true
      }).limit(100);
      
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
      if (!roomId || !senderId || !content) return;
      if (!mongoose.isValidObjectId(roomId) || !mongoose.isValidObjectId(senderId)) return;
      if (typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) return;

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
    if (!data?.roomId || !data?.userId) return;
    
    // Throttle typing events to once every 300ms
    const now = Date.now();
    if (socket.lastTyping && now - socket.lastTyping < 300) return;
    socket.lastTyping = now;

    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username || 'User'
    });
  });

  socket.on('stop-typing', (data) => {
    if (!data?.roomId || !data?.userId) return;
    socket.to(data.roomId).emit('user-stop-typing', {
      userId: data.userId
    });
  });

  // Join user's notification room
  socket.on('join-notifications', (userId) => {
    if (!userId || typeof userId !== 'string') return;
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
