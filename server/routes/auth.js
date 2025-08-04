const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post("/generate-token", (req, res) => {
    try {
        const jwtSecretKey = process.env.JWT_SECRET;
        const data = {
            time: new Date().toISOString(),
            userId: 12,
        };
        const token = jwt.sign(data, jwtSecretKey, { expiresIn: '1h' });
        res.json({
            success: true,
            token: token,
            expiresIn: 3600 // 1 hour in seconds
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to generate token",
            error: err.message
        });
    }
});

router.get("/verify-token", (req, res) => {
    try {
        const jwtSecretKey = process.env.JWT_SECRET;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No authorization header provided"
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format. Use 'Bearer <token>'"
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const verified = jwt.verify(token, jwtSecretKey);
        res.json({
            success: true,
            data: verified,
            expiresAt: new Date(verified.exp * 1000).toISOString()
        });
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Token has expired",
                error: err.message
            });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
                error: err.message
            });
        }
        res.status(400).json({
            success: false,
            message: "Token verification failed",
            error: err.message
        });
    }
});

module.exports = router;