const Notification = require('../models/Notification');

// Create a notification
exports.createNotification = async (req, res) => {
  try {
    const notif = new Notification(req.body);
    await notif.save();
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id })
      .populate('fromUser', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};