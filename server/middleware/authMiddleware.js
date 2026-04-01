// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        let token;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7, authHeader.length);
        } else {
            token = authHeader;
        }

        if (!token) {
             return res.status(401).json({ message: 'No token extractable, authorization denied' });
        }

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("FATAL: JWT_SECRET is not defined in environment variables.");
            return res.status(500).json({ message: 'Server configuration error: JWT secret missing.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;

        if (!req.user || !req.user.id) {
            console.error('Auth Middleware Error: Decoded token is missing "user" object or "user.id".', { decodedPayload: decoded });
            return res.status(401).json({ message: 'Token payload is invalid.' });
        }
        next();
    } catch (err) {
        console.error('Auth Middleware Error: Token verification failed.', { errorMessage: err.message, errorName: err.name });
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token is invalid.' });
        }
        res.status(401).json({ message: 'Token is not valid.' });
    }
};