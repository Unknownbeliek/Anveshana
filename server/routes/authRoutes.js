const express = require('express');
const router = express.Router();
const { login, me, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authLoginLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login — rate limited: 10/min per IP (brute-force protection)
router.post('/login', authLoginLimiter, login);
router.get('/me', authenticate, me);
router.post('/logout', logout);

module.exports = router;
