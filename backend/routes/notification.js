const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);

// Test endpoint to manually trigger a notification
router.post('/test', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const testNotif = await Notification.create({
      user: req.user.id,
      type: 'like',
      fromUser: req.user.id,
      post: 'test-post-id'
    });
    
    const populatedNotif = await Notification.findById(testNotif._id).populate('fromUser', 'name avatar');
    
    const io = req.app.locals.io;
    if (io) {
      io.to(req.user.id).emit('notification', populatedNotif);
      console.log('Test notification sent to user:', req.user.id);
    }
    
    res.json({ message: 'Test notification sent', notification: populatedNotif });
  } catch (err) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;