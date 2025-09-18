const errorHandler = (err, req, res, next) => {
	console.error(`${req.method} ${req.url} - ${err.stack}`);

	// Mongoose validation error
	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors).map((error) => {
			// Provide more user-friendly validation messages
			switch (error.kind) {
				case 'required':
					return `${error.path} is required`;
				case 'maxlength':
					return `${error.path} must be ${error.properties.maxlength} characters or less`;
				case 'minlength':
					return `${error.path} must be at least ${error.properties.minlength} characters`;
				case 'regexp':
					return `${error.path} format is invalid`;
				default:
					return error.message;
			}
		});
		return res.status(400).json({
			success: false,
			errors: errors,
		});
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		const value = err.keyValue[field];
		return res.status(400).json({
			success: false,
			errors: [`${field} '${value}' is already taken`],
		});
	}

	// Mongoose cast error (invalid ObjectId)
	if (err.name === "CastError") {
		return res.status(400).json({
			success: false,
			errors: ["Invalid resource ID"],
		});
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({
			success: false,
			errors: ["Invalid authentication token"],
		});
	}

	if (err.name === "TokenExpiredError") {
		return res.status(401).json({
			success: false,
			errors: ["Authentication token has expired"],
		});
	}

	// Express-validator errors
	if (err.array && typeof err.array === 'function') {
		const errors = err.array().map(error => error.msg);
		return res.status(400).json({
			success: false,
			errors: errors,
		});
	}

	// Rate limiting error
	if (err.status === 429) {
		return res.status(429).json({
			success: false,
			errors: ["Too many requests. Please try again later."],
		});
	}

	// Default server error
	const isDevelopment = process.env.NODE_ENV === 'development';
	res.status(err.status || 500).json({
		success: false,
		errors: [isDevelopment ? err.message : "Internal server error"],
		...(isDevelopment && { stack: err.stack })
	});
};

module.exports = errorHandler;
