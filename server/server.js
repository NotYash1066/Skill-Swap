require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Root route handler
app.get("/", (req, res) => {
	res.json({ message: "Welcome to SkillSwap API" });
});
console.log("MONGO_URI:", process.env.MONGO_URI);

// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/SkillSwapDB')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matches");
const chatRoutes = require("./routes/chat");

// Import error handler
const errorHandler = require("./middleware/error");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/chat", chatRoutes);

// Debug route to verify server is working
app.get("/api/test", (req, res) => {
	res.json({ message: "Test route working" });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their chat rooms
  socket.on('join-rooms', async (userId) => {
    try {
      const ChatRoom = require('./models/ChatRoom');
      const userRooms = await ChatRoom.find({
        participants: userId,
        isActive: true
      });
      
      userRooms.forEach(room => {
        socket.join(room._id.toString());
      });
    } catch (err) {
      console.error('Error joining rooms:', err);
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { roomId, content, senderId } = data;
      const Message = require('./models/Message');
      const ChatRoom = require('./models/ChatRoom');

      // Create and save message
      const message = new Message({
        chatRoom: roomId,
        sender: senderId,
        content
      });

      await message.save();
      await message.populate('sender', 'username');

      // Update chat room
      const chatRoom = await ChatRoom.findById(roomId);
      chatRoom.lastActivity = new Date();
      chatRoom.lastMessage = message._id;
      await chatRoom.save();

      // Emit message to all users in the room
      io.to(roomId).emit('new-message', message);
    } catch (err) {
      console.error('Error sending message:', err);
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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
