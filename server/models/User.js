const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		username: { 
			type: String, 
			required: true, 
			unique: true, 
			trim: true,
			minlength: 3,
			maxlength: 30,
			match: /^[a-zA-Z0-9_]+$/
		},
		email: { 
			type: String, 
			required: true, 
			unique: true, 
			trim: true,
			lowercase: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		},
		password: { 
			type: String, 
			required: true,
			minlength: 6
		},
		bio: { 
			type: String, 
			default: "",
			maxlength: 500,
			trim: true
		},
		avatar: { type: String, default: '' },
		location: { 
			city: { type: String, default: '' },
			country: { type: String, default: '' }
		},
		availability: [{ type: String, enum: ['weekday_morning', 'weekday_afternoon', 'weekday_evening', 'weekend_morning', 'weekend_afternoon', 'weekend_evening'] }],
		skillsOffered: { type: [String], default: [] },
		skillsSought: { type: [String], default: [] },
		proficiency: { type: Map, of: String, default: {} },
		rating: { type: Number, default: 0, min: 0, max: 5 },
		reviewCount: { type: Number, default: 0 },
		isActive: {
			type: Boolean,
			default: true
		},
		lastLoginAt: {
			type: Date
		},
		resetPasswordToken: String,
		resetPasswordExpire: Date,
		refreshToken: String
	},
	{ timestamps: true }
);

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ skillsOffered: 1 });
UserSchema.index({ skillsSought: 1 });
UserSchema.index({ 'location.city': 1 });
UserSchema.index({ 'location.country': 1 });
UserSchema.index({ rating: -1 });

// Virtual for user's full skill set
UserSchema.virtual('allSkills').get(function() {
	const offered = this.skillsOffered || [];
	const sought = this.skillsSought || [];
	return [...offered, ...sought];
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
