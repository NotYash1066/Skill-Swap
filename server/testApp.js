require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

module.exports = app;
