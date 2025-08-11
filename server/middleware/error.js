const errorHandler = (err, req, res, next) => {
	console.error(err.stack);

	// Mongoose validation error
	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors).map((error) => error.message);
		return res.status(400).json({
			success: false,
			errors: errors,
		});
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		return res.status(400).json({
			success: false,
			errors: ["Duplicate field value entered"],
		});
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({
			success: false,
			errors: ["Invalid token"],
		});
	}

	if (err.name === "TokenExpiredError") {
		return res.status(401).json({
			success: false,
			errors: ["Token expired"],
		});
	}

	// Default server error
	res.status(500).json({
		success: false,
		errors: ["Server Error"],
	});
};

module.exports = errorHandler;
