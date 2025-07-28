const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Send message (handles both one-to-one and group)
router.post('/send', auth, messageController.sendMessage);
// Get one-to-one messages for a chat
router.get('/one-to-one/:chatId', auth, messageController.getOneToOneMessages);
// Get group messages for a group
router.get('/group/:groupId', auth, messageController.getGroupMessages);

module.exports = router;
