const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const sendEmail = require('../utils/sendEmail');
const { generateAccessToken } = require('../utils/generateTokens');
const crypto = require('crypto');

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
router.post("/forgot-password", authLimiter, [
	check("email").trim().isEmail().withMessage("Please include a valid email").normalizeEmail()
], async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({ errors: [{ msg: "User not found" }] });
		}

		const resetToken = crypto.randomBytes(20).toString('hex');
		user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
		user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
		await user.save();

		const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
		const message = `You requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

		try {
			await sendEmail({
				email: user.email,
				subject: 'Password Reset Request - SkillSwap',
				message,
				html: `<p>You requested a password reset.</p><p>Please click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link will expire in 10 minutes.</p><p>If you did not request this, please ignore this email.</p>`
			});
			res.json({ success: true, message: 'Password reset email sent' });
		} catch (err) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save();
			return res.status(500).json({ errors: [{ msg: 'Email could not be sent' }] });
		}
	} catch (err) {
		return next(err);
	}
});

// @route   PUT /api/auth/reset-password/:resettoken
// @desc    Reset password
router.put("/reset-password/:resettoken", authLimiter, [
	check("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage("Password must contain uppercase, lowercase, and number")
], async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
		const user = await User.findOne({
			resetPasswordToken,
			resetPasswordExpire: { $gt: Date.now() }
		});

		if (!user) {
			return res.status(400).json({ errors: [{ msg: 'Invalid or expired token' }] });
		}

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(req.body.password, salt);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		await user.save();

		res.json({ success: true, message: 'Password reset successful' });
	} catch (err) {
		return next(err);
	}
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
router.post("/refresh-token", async (req, res, next) => {
	const { refreshToken } = req.body;
	if (!refreshToken) {
		return res.status(401).json({ errors: [{ msg: 'Refresh token required' }] });
	}

	try {
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
		const user = await User.findOne({ _id: decoded.id, refreshToken });
		
		if (!user) {
			return res.status(403).json({ errors: [{ msg: 'Invalid refresh token' }] });
		}

		const newAccessToken = generateAccessToken(user._id);
		res.json({ success: true, token: newAccessToken });
	} catch (err) {
		return res.status(403).json({ errors: [{ msg: 'Invalid refresh token' }] });
	}
});

// @route   POST /api/auth/logout
// @desc    Logout user (clear refresh token)
router.post("/logout", auth, async (req, res, next) => {
	try {
		req.user.refreshToken = null;
		await req.user.save();
		res.json({ success: true, message: 'Logged out successfully' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
