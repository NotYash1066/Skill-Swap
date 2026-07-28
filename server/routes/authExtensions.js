const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authLimiter } = require("../middleware/rateLimit");
const crypto = require('crypto');

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
		user.refreshToken = null;
		user.tokenVersion = (user.tokenVersion || 0) + 1;
		await user.save();

		res.json({ success: true, message: 'Password reset successful' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
