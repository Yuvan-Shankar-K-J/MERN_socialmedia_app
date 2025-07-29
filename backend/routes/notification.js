const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Create a notification
router.post('/', auth, notificationController.createNotification);
// Get notifications for logged-in user
router.get('/', auth, notificationController.getNotifications);
// Mark a notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

module.exports = router;