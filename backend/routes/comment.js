const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Add a comment to a post
router.post('/:postId', auth, commentController.addComment);
// Get comments for a post
router.get('/:postId', auth, commentController.getComments);
// Delete a comment
router.delete('/:id', auth, commentController.deleteComment);
// Like a comment
router.post('/:id/like', auth, commentController.likeComment);
// Unlike a comment
router.post('/:id/unlike', auth, commentController.unlikeComment);

module.exports = router;