const Post = require('../models/Post');
const User = require('../models/User');
const path = require('path');
const Notification = require('../models/Notification');

const getIO = req => req.app && req.app.locals && req.app.locals.io;

// Create a new post (with optional media upload)
exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let media = '';
    if (req.file) {
      media = `/assets/${req.file.filename}`;
    }
    const post = new Post({ user: req.user.id, text, media });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all posts (optionally filter by user)
exports.getPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { user: userId } : {};
    const posts = await Post.find(filter).populate('user', 'name avatar').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    await post.remove();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.likes.includes(req.user.id)) return res.status(400).json({ error: 'Already liked' });
    post.likes.push(req.user.id);
    await post.save();
    // Create notification if not liking own post
    if (post.user.toString() !== req.user.id) {
      console.log('Creating like notification for post:', post._id, 'from user:', req.user.id, 'to user:', post.user);
      const notif = await Notification.create({
        user: post.user,
        type: 'like',
        fromUser: req.user.id,
        post: post._id
      });
      console.log('Notification created:', notif);
      const io = getIO(req);
      if (io) {
        console.log('Emitting notification to user:', post.user.toString());
        io.to(post.user.toString()).emit('notification', notif);
      } else {
        console.log('Socket.IO not available');
      }
    }
    res.json(post);
  } catch (err) {
    console.error('Error in likePost:', err);
    res.status(500).json({ error: err.message });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.likes = post.likes.filter(uid => uid.toString() !== req.user.id);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feed: posts from followed users
exports.getFeed = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    const followingIds = user.following.concat([user._id]); // include own posts
    const posts = await Post.find({ user: { $in: followingIds } })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get explore: random/public posts
exports.getExplore = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      { $sample: { size: 20 } }
    ]);
    // Populate user info for each post
    const populatedPosts = await Post.populate(posts, { path: 'user', select: 'name avatar' });
    res.json(populatedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};