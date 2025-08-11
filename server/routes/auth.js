const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
	"/register",
	[
		check("username", "Username is required").not().isEmpty(),
		check("email", "Please include a valid email").isEmail(),
		check(
			"password",
			"Please enter a password with 6 or more characters"
		).isLength({ min: 6 }),
	],
	async (req, res) => {
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

			// Create JWT token
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				process.env.JWT_SECRET,
				{ expiresIn: "5h" },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error");
		}
	}
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post(
	"/login",
	[
		check("email", "Please include a valid email").isEmail(),
		check("password", "Password is required").exists(),
	],
	async (req, res) => {
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

			// Create JWT token
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				process.env.JWT_SECRET,
				{ expiresIn: "5h" },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error");
		}
	}
);

// @route   GET /api/auth/me
// @desc    Get current user
router.get("/me", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
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

module.exports = router;
