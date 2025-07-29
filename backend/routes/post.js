const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/assets'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create a post (with optional media upload)
router.post('/', auth, upload.single('media'), postController.createPost);
// Get posts (optionally by user)
router.get('/', auth, postController.getPosts);
// Get feed (posts from followed users)
router.get('/feed', auth, postController.getFeed);
// Get explore (random/public posts)
router.get('/explore', auth, postController.getExplore);
// Delete a post
router.delete('/:id', auth, postController.deletePost);
// Like a post
router.post('/:id/like', auth, postController.likePost);
// Unlike a post
router.post('/:id/unlike', auth, postController.unlikePost);

module.exports = router;