const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authLimiter, skillsLimiter } = require("../middleware/rateLimit");
const { validateObjectId } = require("../middleware/inputValidation");
const { LIMITS } = require("../constants");

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

			// Create JWT token (synchronously so errors are caught by this try/catch)
			const payload = {
				user: {
					id: user.id,
				},
			};
			const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5h" });
			return res.json({ success: true, token });
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

			// Create JWT token (synchronously so errors are caught by this try/catch)
			const payload = {
				user: {
					id: user.id,
				},
			};
			const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5h" });
			return res.json({ success: true, token });
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
router.get("/verify-token", (req, res) => {
	try {
		const jwtSecretKey = process.env.JWT_SECRET;
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

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		const verified = jwt.verify(token, jwtSecretKey);
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
		res.status(400).json({
			success: false,
			message: "Token verification failed",
			error: err.message,
		});
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

module.exports = router;
