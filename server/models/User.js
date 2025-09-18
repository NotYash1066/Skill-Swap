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
		skillsOffered: [{ 
			type: String,
			trim: true,
			maxlength: 50
		}],
		skillsSought: [{ 
			type: String,
			trim: true,
			maxlength: 50
		}],
		isActive: {
			type: Boolean,
			default: true
		},
		lastLoginAt: {
			type: Date
		}
	},
	{ timestamps: true }
);

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ skillsOffered: 1 });
UserSchema.index({ skillsSought: 1 });

// Virtual for user's full skill set
UserSchema.virtual('allSkills').get(function() {
	return [...this.skillsOffered, ...this.skillsSought];
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
