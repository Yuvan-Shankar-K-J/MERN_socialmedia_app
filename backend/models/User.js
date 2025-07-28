const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: {
    type: String,
    default: function() {
      // Use DiceBear free avatar API
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${this.name || 'user'}`;
    },
  },
  username: { type: String, unique: true, sparse: true },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  dateJoined: { type: Date, default: Date.now },
  twoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
