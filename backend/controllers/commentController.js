const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { getIO } = require('../index');

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const comment = new Comment({ post: postId, user: req.user.id, text });
    await comment.save();
    // Notify post owner if not commenting on own post
    const post = await Post.findById(postId);
    if (post && post.user.toString() !== req.user.id) {
      console.log('Creating comment notification for post:', postId, 'from user:', req.user.id, 'to user:', post.user);
      const notif = await Notification.create({
        user: post.user,
        type: 'comment',
        fromUser: req.user.id,
        post: postId,
        comment: comment._id
      });
      console.log('Comment notification created:', notif);
      const io = getIO(req);
      if (io) {
        console.log('Emitting comment notification to user:', post.user.toString());
        io.to(post.user.toString()).emit('notification', notif);
      } else {
        console.log('Socket.IO not available for comment notification');
      }
    }
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error in addComment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).populate('user', 'name avatar').sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('user');
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if the user is the owner of the comment
    if (comment.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error in deleteComment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.likes.includes(req.user.id)) return res.status(400).json({ error: 'Already liked' });
    comment.likes.push(req.user.id);
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.likes = comment.likes.filter(uid => uid.toString() !== req.user.id);
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};