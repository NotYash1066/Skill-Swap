const mongoose = require("mongoose");

const SkillListingSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true },
		category: { type: String, required: true, trim: true },
		status: { type: String, enum: ["active", "inactive"], default: "active" },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("SkillListing", SkillListingSchema);
