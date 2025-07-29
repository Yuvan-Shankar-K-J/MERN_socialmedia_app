const express = require('express');
const router = express.Router();
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.get('/:postId', auth, getComments);
router.post('/:postId', auth, addComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;