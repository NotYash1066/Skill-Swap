require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

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
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB Connected..."))
	.catch((err) => console.log(err));

// Import routes
const authRoutes = require("./routes/auth");

// Import error handler
const errorHandler = require("./middleware/error");

// Use routes
app.use("/api/auth", authRoutes);

// Debug route to verify server is working
app.get("/api/test", (req, res) => {
	res.json({ message: "Test route working" });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
