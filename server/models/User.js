const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true },
		password: { type: String, required: true },
		bio: { type: String, default: "" },
		skillsOffered: [{ type: String }],
		skillsSought: [{ type: String }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
