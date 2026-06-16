const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

const router = express.Router();

// Get User Profile
router.get('/', authMiddleware, profileController.getProfile);

// Update User Profile
router.put('/', authMiddleware, profileController.updateProfile);

// Update Password
router.put('/password', authMiddleware, profileController.changePassword);

// Delete User Account
router.delete('/', authMiddleware, profileController.deleteProfile);

module.exports = router;