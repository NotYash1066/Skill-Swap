require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// Root route handler
app.get("/", (req, res) => {
    res.json({ message: "Welcome to SkillSwap API" });
});

// DB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected..."))
    .catch((err) => console.log(err));

// Import routes
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api', authRoutes);

// Token routes should be moved to auth.js
// Remove or comment out the /api/generate-token and /api/verify-token routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));