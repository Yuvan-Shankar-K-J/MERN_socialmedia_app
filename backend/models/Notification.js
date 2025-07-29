const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // receiver
  type: { type: String, enum: ['like', 'comment', 'follow', 'message', 'mention'], required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);