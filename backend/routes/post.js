const express = require('express');
const router = express.Router();
const { createPost, getFeed, getExplore, likePost, unlikePost, deletePost } = require('../controllers/postController');
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

router.post('/', auth, createPost);
router.get('/feed', auth, getFeed);
router.get('/explore', auth, getExplore);
router.post('/:id/like', auth, likePost);
router.post('/:id/unlike', auth, unlikePost);
router.delete('/:id', auth, deletePost);

module.exports = router;