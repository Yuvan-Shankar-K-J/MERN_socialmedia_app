const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  name: { type: String }, // For group chats
  isGroup: { type: Boolean, default: false },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For group admin
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
