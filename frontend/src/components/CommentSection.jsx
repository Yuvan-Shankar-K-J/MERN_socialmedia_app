import React, { useEffect, useState, useContext, useRef } from 'react';
import { getComments, addComment } from '../services/api';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

const CommentSection = ({ postId, token, user, postOwnerId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
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
    if (!text.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await addComment(postId, text, token);
      setComments(comments => [...comments, { ...res.data, user: { _id: user._id, name: user.name, avatar: user.avatar } }]);
      setText('');
    } catch {
      setError('Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ marginTop: 18, background: '#f7f7f7', borderRadius: 12, padding: 18, overflowX: 'hidden', maxWidth: '100%', boxShadow: '0 2px 8px #b2e1ff22', textAlign: 'left' }}>
      {/* Real-time notifications */}
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
      {loading ? <div>Loading...</div> : comments.length === 0 ? <div>No comments yet.</div> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxWidth: '100%' }}>
          {comments.map((c, i) => (
            <li key={c._id || i} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 8, color: '#111', maxWidth: '100%', wordBreak: 'break-word', textAlign: 'left' }}>
              <span style={{ fontWeight: 600 }}>{c.user?.name || 'User'}:</span> {c.text}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 16, maxWidth: '100%' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment..."
          style={{ flex: 1, borderRadius: 4, border: '1px solid #ccc', padding: 6, maxWidth: '100%', background: '#fff', color: '#111' }}
        />
        <button type="submit" disabled={posting || !text.trim()} style={{ borderRadius: 4, background: '#fff', color: '#111', border: '1px solid #6a82fb', padding: '6px 16px', fontWeight: 700 }}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
    </div>
  );
};

export default CommentSection;