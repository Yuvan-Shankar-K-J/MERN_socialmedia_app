const Chat = require('../models/Chat');
const User = require('../models/User');

exports.createChat = async (req, res) => {
  try {
    const { userIds, isGroup, name } = req.body;
    
    if (!userIds || userIds.length < 1) {
      return res.status(400).json({ message: 'At least one user (the creator) is required' });
    }
    
    // For one-to-one chats, check if chat already exists
    if (!isGroup && userIds.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        users: { $all: userIds, $size: userIds.length }
      });
      
      if (existingChat) {
        return res.status(200).json(existingChat);
      }
    }
    
    // For group chats, validate name
    if (isGroup && (!name || name.trim().length === 0)) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    const chat = new Chat({
      name: isGroup ? name : undefined,
      isGroup: !!isGroup,
      users: userIds,
      admin: isGroup ? req.user.id : undefined,
    });
    
    await chat.save();
    
    // Populate user information
    await chat.populate('users', 'name email avatar');
    if (isGroup) {
      await chat.populate('admin', 'name email avatar');
    }
    
    res.status(201).json(chat);
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user.id })
      .populate('users', 'name email avatar')
      .populate('admin', 'name email avatar');
    
    res.json(chats);
  } catch (err) {
    console.error('Get user chats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addUserToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    // Check if user is admin or member of the group
    if (chat.admin.toString() !== req.user.id && !chat.users.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if user to be added exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!chat.users.includes(userId)) {
      chat.users.push(userId);
      await chat.save();
      await chat.populate('users', 'name email avatar');
    }
    
    res.json(chat);
  } catch (err) {
    console.error('Add user to group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeUserFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    // Only admin can remove users
    if (chat.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can remove users' });
    }
    
    chat.users = chat.users.filter(id => id.toString() !== userId);
    await chat.save();
    await chat.populate('users', 'name email avatar');
    
    res.json(chat);
  } catch (err) {
    console.error('Remove user from group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    if (chat.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group admin can close the group' });
    }
    
    await Chat.findByIdAndDelete(chatId);
    res.json({ message: 'Group closed successfully' });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
