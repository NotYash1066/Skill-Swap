require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { apiLimiter } = require("./middleware/rateLimit");

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matches");
const notificationRoutes = require("./routes/notifications");
const authExtensionsRoutes = require("./routes/authExtensions");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", authExtensionsRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;
