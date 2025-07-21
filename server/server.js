require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// DB Connection
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB Connected..."))
	.catch((err) => console.log(err));

// Routes will go here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
