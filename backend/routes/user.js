const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Follow a user
router.post('/:id/follow', auth, userController.followUser);
// Unfollow a user
router.post('/:id/unfollow', auth, userController.unfollowUser);
// Get followers
router.get('/:id/followers', auth, userController.getFollowers);
// Get following
router.get('/:id/following', auth, userController.getFollowing);

module.exports = router;