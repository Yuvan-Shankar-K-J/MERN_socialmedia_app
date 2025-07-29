import React, { useEffect, useState, useContext, useRef } from 'react';
import { getComments, addComment, deleteComment } from '../services/api';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

const CommentSection = ({ postId, token, user, postOwnerId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    setLoading(true);
    getComments(postId, token)
      .then(res => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [postId, token]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    if (token && user && postOwnerId === user.id) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` }
      });

      socketRef.current.on('notification', (newNotification) => {
        // Only show notifications for this specific post
        if (newNotification.post === postId) {
          setNotifications(prev => [newNotification, ...prev.slice(0, 2)]); // Keep only last 3 notifications
          
          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n._id !== newNotification._id));
          }, 5000);
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token, user, postOwnerId, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await addComment(postId, newComment, token);
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId, token);
        setComments(comments.filter(comment => comment._id !== commentId));
      } catch (err) {
        console.error('Error deleting comment:', err);
        alert('Failed to delete comment');
      }
    }
  };

  return (
    <div style={{ marginTop: 18, background: '#f7f7f7', borderRadius: 12, padding: 18, overflowX: 'hidden', maxWidth: '100%', boxShadow: '0 2px 8px #b2e1ff22', textAlign: 'left' }}>
      {/* Real-time notifications display */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {notifications.map(notification => (
            <div key={notification._id} style={{
              background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              animation: 'slideIn 0.3s ease-out'
            }}>
              {notification.type === 'like' && (
                <span>❤️ <b>{notification.fromUser?.name || 'Someone'}</b> liked your post</span>
              )}
              {notification.type === 'comment' && (
                <span>💬 <b>{notification.fromUser?.name || 'Someone'}</b> commented: <span style={{ fontStyle: 'italic' }}>"{notification.comment?.text || ''}"</span></span>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Comments</div>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: loading || !newComment.trim() ? 0.6 : 1 }}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
      
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '1em' }}>No comments yet. Be the first to comment!</div>
        ) : (
          comments.map(comment => {
            const isOwner = comment.user?._id === user.id || comment.user?.id === user.id;
            return (
              <div key={comment._id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', wordBreak: 'break-word' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={comment.user?.avatar} alt={comment.user?.name} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, objectFit: 'cover' }} />
                    <strong style={{ fontSize: 14, color: '#111' }}>{comment.user?.name}</strong>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 12, padding: '2px 4px', borderRadius: 4 }}
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div style={{ color: '#111', fontSize: 14, marginLeft: 32 }}>{comment.text}</div>
                <div style={{ fontSize: 11, color: '#888', marginLeft: 32, marginTop: 4 }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;