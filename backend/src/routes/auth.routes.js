const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Register a new user
router.post('/register', authController.register);

// User Login
router.post('/login', authController.login);

// Refresh Access Token
router.post('/refresh', authController.refresh);

// User Logout
router.post('/logout', authController.logout);

// Get Current User
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
