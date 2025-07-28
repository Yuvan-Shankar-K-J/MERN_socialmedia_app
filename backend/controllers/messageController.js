const OneToOneMessage = require('../models/OneToOneMessage');
const GroupMessage = require('../models/GroupMessage');
const Chat = require('../models/Chat');
const User = require('../models/User');

// Send a message (one-to-one or group)
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    
    if (!chatId || !content) {
      return res.status(400).json({ message: 'chatId and content required' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    let message;
    if (chat.isGroup) {
      message = new GroupMessage({
        groupId: chatId,
        sender: req.user.id,
        content,
      });
      await message.save();
      // Populate sender information
      await message.populate('sender', 'name email avatar');
    } else {
      // Find the other user in the chat
      const receiver = chat.users.find(u => u.toString() !== req.user.id.toString());
      if (!receiver) {
        return res.status(400).json({ message: 'Invalid chat configuration' });
      }
      
      message = new OneToOneMessage({
        chatId,
        sender: req.user.id,
        receiver,
        content,
      });
      await message.save();
      // Populate sender and receiver information
      await message.populate('sender', 'name email avatar');
      await message.populate('receiver', 'name email avatar');
    }
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all one-to-one messages for a chat, sorted by time
exports.getOneToOneMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Verify the chat exists and user is part of it
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find all messages for this chat, sorted by createdAt
    const messages = await OneToOneMessage.find({ chatId })
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Get one-to-one messages error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all group messages for a group, sorted by time
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verify the group exists and user is part of it
    const chat = await Chat.findById(groupId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const messages = await GroupMessage.find({ groupId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Get group messages error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
