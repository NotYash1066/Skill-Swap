const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authLimiter, skillsLimiter } = require("../middleware/rateLimit");
const { validateObjectId } = require("../middleware/inputValidation");
const { LIMITS } = require("../constants");
const upload = require("../middleware/upload");
const nodemailer = require("nodemailer");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");

// Create transporter once (singleton pattern for efficiency)
let transporter = null;
const getTransporter = () => {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});
	}
	return transporter;
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
	"/register",
	authLimiter, // Apply auth rate limiting
	[
		check("username")
			.trim()
			.isLength({ min: 3, max: 30 })
			.withMessage("Username must be 3-30 characters")
			.matches(/^[a-zA-Z0-9_]+$/)
			.withMessage("Username can only contain letters, numbers, and underscores"),
		check("email")
			.trim()
			.isEmail()
			.withMessage("Please include a valid email")
			.normalizeEmail(),
		check("password")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters")
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
			.withMessage("Password must contain uppercase, lowercase, and number"),
	],
	async (req, res, next) => {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const { username, email, password } = req.body;

			// Check if user exists
			let user = await User.findOne({ $or: [{ email }, { username }] });
			if (user) {
				return res.status(400).json({
					errors: [{ msg: "User already exists" }],
				});
			}

			// Create new user
			user = new User({
				username,
				email,
				password,
			});

			// Hash password
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);

			await user.save();

			const token = generateAccessToken(user);
			const refreshToken = generateRefreshToken(user);
			user.refreshToken = refreshToken;
			await user.save();
			return res.json({ success: true, token, refreshToken });
		} catch (err) {
			return next(err);
		}
	}
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post(
	"/login",
	authLimiter, // Apply auth rate limiting
	[
		check("email")
			.trim()
			.isEmail()
			.withMessage("Please include a valid email")
			.normalizeEmail(),
		check("password")
			.exists()
			.withMessage("Password is required"),
	],
	async (req, res, next) => {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const { email, password } = req.body;

			// Check if user exists
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(400).json({
					errors: [{ msg: "Invalid credentials" }],
				});
			}

			// Verify password
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({
					errors: [{ msg: "Invalid credentials" }],
				});
			}

			const token = generateAccessToken(user);
			const refreshToken = generateRefreshToken(user);
			user.refreshToken = refreshToken;
			await user.save();
			return res.json({ success: true, token, refreshToken });
		} catch (err) {
			return next(err);
		}
	}
);

// @route   GET /api/auth/me
// @desc    Get current user
router.get("/me", auth, async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (err) {
		return next(err);
	}
});

// @route   GET /api/auth/verify-token
// @desc    Verify JWT token
router.get("/verify-token", async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: "No authorization header provided",
			});
		}

		if (!authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "Invalid authorization format. Use 'Bearer <token>'",
			});
		}

		const token = authHeader.substring(7);
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(verified.user?.id).select("-password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Token user not found",
			});
		}

		const tokenVersion = verified.user?.tokenVersion || 0;
		if (tokenVersion !== (user.tokenVersion || 0)) {
			return res.status(401).json({
				success: false,
				message: "Token has been revoked",
			});
		}

		res.json({
			success: true,
			data: verified,
			expiresAt: new Date(verified.exp * 1000).toISOString(),
		});
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			return res.status(401).json({
				success: false,
				message: "Token has expired",
				error: err.message,
			});
		}
		if (err instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
				error: err.message,
			});
		}
		return next(err);
	}
});

// @route   PUT /api/auth/skills
// @desc    Update user skills
router.put("/skills", auth, skillsLimiter, async (req, res, next) => {
	try {
		const { skillsOffered, skillsSought } = req.body;
		
		// Validate and sanitize skills
		const sanitizeSkills = (skills) => {
			if (!Array.isArray(skills)) return [];
			return skills
				.filter(skill => typeof skill === 'string' && skill.trim().length > 0)
				.map(skill => skill.trim().toLowerCase())
				.filter(skill => skill.length <= LIMITS.MAX_SKILL_LENGTH)
				.slice(0, LIMITS.MAX_SKILLS);
		};

		const sanitizedOffered = sanitizeSkills(skillsOffered);
		const sanitizedSought = sanitizeSkills(skillsSought);

		// Validate that user has at least one skill offered or sought
		if (sanitizedOffered.length === 0 && sanitizedSought.length === 0) {
			return res.status(400).json({
				success: false,
				errors: ["Please add at least one skill offered or one skill sought."]
			});
		}
		
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ 
				skillsOffered: sanitizedOffered,
				skillsSought: sanitizedSought
			},
			{ new: true }
		).select("-password");

		res.json(user);
	} catch (err) {
		return next(err);
	}
});

// @route   POST /api/auth/avatar
// @desc    Upload avatar
router.post("/avatar", auth, upload.single('avatar'), async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({ errors: ['No file uploaded'] });
		}
		
		const avatarUrl = `/uploads/avatars/${req.file.filename}`;
		
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ avatar: avatarUrl },
			{ new: true }
		).select("-password");
		
		res.json({ avatar: avatarUrl, user });
	} catch (err) {
		return next(err);
	}
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put("/profile", auth, async (req, res, next) => {
	try {
		const { bio, avatar, location, availability, proficiency } = req.body;
		const updates = {};
		
		if (bio !== undefined) {
			if (typeof bio !== 'string' || bio.length > LIMITS.MAX_BIO_LENGTH) {
				return res.status(400).json({ errors: [`Bio must be a string, max ${LIMITS.MAX_BIO_LENGTH} chars`] });
			}
			updates.bio = bio.trim();
		}

		if (avatar !== undefined) updates.avatar = avatar;
		if (location) updates.location = location;
		if (availability) updates.availability = availability;
		if (proficiency) updates.proficiency = proficiency;
		
		const user = await User.findByIdAndUpdate(
			req.user.id,
			updates,
			{ new: true }
		).select("-password");

		res.json(user);
	} catch (err) {
		return next(err);
	}
});

// @route   GET /api/auth/user/:id
// @desc    Get user profile by ID
router.get("/user/:id", validateObjectId, async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id).select("-password");
		if (!user) return res.status(404).json({ msg: 'User not found' });
		res.json(user);
	} catch (err) {
		return next(err);
	}
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post("/forgot-password", authLimiter, async (req, res, next) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			// Security best practice: Don't reveal if user exists
			return res.json({
				success: true,
				msg: "If an account exists, a reset email has been sent",
			});
		}

		const resetToken = crypto.randomBytes(20).toString("hex");
		user.resetPasswordToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
		await user.save();

		// Send email
		const transporter = getTransporter();
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Password Reset - SkillSwap",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your SkillSwap account.</p>
          <p>Click the link below to reset your password:</p>
			  <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
		});

		res.json({ success: true, msg: "Password reset email sent" });
	} catch (err) {
		console.error("Password reset error:", err);
		return next(err);
	}
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
router.post("/refresh-token", authLimiter, async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ msg: "Refresh token required" });
		}

		// Verify refresh token
		let decoded;
		try {
			decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				return res.status(401).json({ msg: "Refresh token expired" });
			}
			return res.status(401).json({ msg: "Invalid refresh token" });
		}

		if (!decoded.user?.id) {
			return res.status(401).json({ msg: "Invalid refresh token" });
		}

		// Check if user exists
		const user = await User.findById(decoded.user.id);
		if (!user) {
			return res.status(401).json({ msg: "User not found" });
		}

		if (user.refreshToken !== refreshToken) {
			return res.status(401).json({ msg: "Invalid refresh token" });
		}

		const tokenVersion = decoded.user?.tokenVersion || 0;
		if (tokenVersion !== (user.tokenVersion || 0)) {
			return res.status(401).json({ msg: "Refresh token has been revoked" });
		}

		const newToken = generateAccessToken(user);
		const newRefreshToken = generateRefreshToken(user);
		user.refreshToken = newRefreshToken;
		await user.save();

		res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
	} catch (err) {
		return next(err);
	}
});

router.post("/logout", async (req, res, next) => {
	try {
		const { refreshToken } = req.body || {};
		let userId = null;

		const authHeader = req.header("Authorization") || req.header("x-auth-token");
		const accessToken = authHeader?.startsWith("Bearer ")
			? authHeader.replace("Bearer ", "")
			: authHeader;

		if (accessToken) {
			try {
				const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);
				userId = decodedAccessToken.user?.id || null;
			} catch (error) {
				userId = null;
			}
		}

		if (!userId && refreshToken) {
			try {
				const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
				userId = decodedRefreshToken.user?.id || null;
			} catch (error) {
				userId = null;
			}
		}

		if (!userId) {
			return res.status(401).json({ success: false, msg: "Invalid logout credentials" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(401).json({ success: false, msg: "User not found" });
		}

		if (refreshToken && user.refreshToken && user.refreshToken !== refreshToken) {
			return res.status(401).json({ success: false, msg: "Invalid refresh token" });
		}

		user.refreshToken = null;
		user.tokenVersion = (user.tokenVersion || 0) + 1;
		await user.save();
		res.json({ success: true, message: "Logged out successfully" });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
