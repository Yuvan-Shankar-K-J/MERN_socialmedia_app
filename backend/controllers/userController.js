const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');

const getIO = req => req.app && req.app.locals && req.app.locals.io;

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ],
      _id: { $ne: req.user.id },
    }).select('name email avatar _id');
    
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.location !== undefined) updates.location = req.body.location;
    // Do not allow editing dateJoined

    // If username is being updated, check uniqueness
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('name email avatar username bio location dateJoined createdAt');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleTwoFactor = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactorEnabled = enabled;
    await user.save();

    res.json({ 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: user.twoFactorEnabled 
    });
  } catch (err) {
    console.error('Two-factor toggle error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    // For demo purposes, return mock data
    // In a real app, you'd store login history in a separate collection
    const loginHistory = [
      { 
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        location: 'New York, NY', 
        device: 'Chrome on MacBook Pro',
        ip: '192.168.1.1'
      },
      { 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        location: 'San Francisco, CA', 
        device: 'Safari on iPhone',
        ip: '192.168.1.2'
      },
      { 
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        location: 'New York, NY', 
        device: 'Chrome on MacBook Pro',
        ip: '192.168.1.1'
      }
    ];

    res.json(loginHistory);
  } catch (err) {
    console.error('Login history error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getLinkedAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For demo purposes, return mock data
    // In a real app, you'd store linked accounts in a separate collection
    const linkedAccounts = [
      { provider: 'Google', connected: true, email: 'user@gmail.com', linkedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { provider: 'Apple', connected: false },
      { provider: 'Facebook', connected: false }
    ];

    res.json(linkedAccounts);
  } catch (err) {
    console.error('Linked accounts error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.linkAccount = async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ message: 'Provider is required' });
    }

    // In a real app, you'd implement OAuth flow here
    // For demo purposes, we'll just return success
    res.json({ 
      message: `${provider} account linked successfully`,
      provider,
      connected: true
    });
  } catch (err) {
    console.error('Link account error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.unlinkAccount = async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ message: 'Provider is required' });
    }

    // In a real app, you'd remove the OAuth connection here
    // For demo purposes, we'll just return success
    res.json({ 
      message: `${provider} account unlinked successfully`,
      provider,
      connected: false
    });
  } catch (err) {
    console.error('Unlink account error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar username bio location dateJoined createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!userToFollow) return res.status(404).json({ error: 'User not found' });
    if (userToFollow._id.equals(currentUser._id)) return res.status(400).json({ error: 'Cannot follow yourself' });
    if (currentUser.following.includes(userToFollow._id)) return res.status(400).json({ error: 'Already following' });
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    await currentUser.save();
    await userToFollow.save();
    // Create notification
    const notif = await Notification.create({
      user: userToFollow._id,
      type: 'follow',
      fromUser: currentUser._id
    });
    const io = getIO(req);
    if (io) io.to(userToFollow._id.toString()).emit('notification', notif);
    res.json({ message: 'Followed user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!userToUnfollow) return res.status(404).json({ error: 'User not found' });
    if (!currentUser.following.includes(userToUnfollow._id)) return res.status(400).json({ error: 'Not following' });
    currentUser.following = currentUser.following.filter(uid => !uid.equals(userToUnfollow._id));
    userToUnfollow.followers = userToUnfollow.followers.filter(uid => !uid.equals(currentUser._id));
    await currentUser.save();
    await userToUnfollow.save();
    res.json({ message: 'Unfollowed user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'name avatar');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get following of a user
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name avatar');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 