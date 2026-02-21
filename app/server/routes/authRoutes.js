const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;