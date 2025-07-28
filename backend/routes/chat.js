const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.post('/create', auth, chatController.createChat);
router.get('/my', auth, chatController.getUserChats);
router.post('/group/add', auth, chatController.addUserToGroup);
router.post('/group/remove', auth, chatController.removeUserFromGroup);
router.post('/group/delete', auth, chatController.deleteGroup);

module.exports = router;
