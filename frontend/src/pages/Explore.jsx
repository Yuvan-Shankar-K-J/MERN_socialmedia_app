import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getExplore, likePost, unlikePost, followUser, unfollowUser } from '../services/api';
import CommentSection from '../components/CommentSection';

const getMediaUrl = (media) => {
  if (!media) return '';
  if (media.startsWith('/assets/')) {
    return (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000') + media;
  }
  return media;
};

const Explore = () => {
  const { token, user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openComments, setOpenComments] = useState({});
  const [following, setFollowing] = useState({});

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getExplore(token)
      .then(res => {
        setPosts(res.data);
        setError('');
      })
      .catch(() => setError('Failed to load explore posts'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleLike = async (postId, liked) => {
    try {
      if (liked) {
        await unlikePost(postId, token);
      } else {
        await likePost(postId, token);
      }
      setPosts(posts => posts.map(post =>
        post._id === postId
          ? {
              ...post,
              likes: liked
                ? post.likes.filter(uid => uid !== user.id && uid !== user._id)
                : [...post.likes, user.id || user._id]
            }
          : post
      ));
    } catch {}
  };

  const handleFollow = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await unfollowUser(userId, token);
        setFollowing(f => ({ ...f, [userId]: false }));
      } else {
        await followUser(userId, token);
        setFollowing(f => ({ ...f, [userId]: true }));
      }
    } catch {}
  };

  if (loading) return <div>Loading explore...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Explore</h2>
      {loading ? (
        <div>Loading explore...</div>
      ) : error ? (
        <div>{error}</div>
      ) : posts.length === 0 ? (
        <div>No posts to show.</div>
      ) : (
        posts.map(post => {
          const liked = post.likes?.includes(user.id) || post.likes?.includes(user._id);
          return (
            <div key={post._id} style={{ border: '1px solid #e0e7ef', margin: '2em auto', padding: '1.5em', borderRadius: 16, maxWidth: 600, width: '100%', background: '#fff', boxSizing: 'border-box', boxShadow: '0 2px 12px rgba(80,120,200,0.08)', textAlign: 'left', color: '#111' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <img src={post.user?.avatar} alt={post.user?.name} style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                <strong style={{ color: '#111' }}>{post.user?.name}</strong>
                {post.user?._id !== user.id && post.user?.id !== user.id && (
                  <button
                    onClick={() => handleFollow(post.user?._id || post.user?.id, following[post.user?._id || post.user?.id])}
                    style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 6, background: following[post.user?._id || post.user?.id] ? '#eee' : 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)', color: following[post.user?._id || post.user?.id] ? '#333' : '#111', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    {following[post.user?._id || post.user?.id] ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
              <div style={{ color: '#111' }}>{post.text}</div>
              {post.media && (getMediaUrl(post.media).endsWith('.mp4') || getMediaUrl(post.media).endsWith('.webm') ? (
                <video src={getMediaUrl(post.media)} controls style={{ maxWidth: '100%', maxHeight: 300 }} />
              ) : (
                <img src={getMediaUrl(post.media)} alt="media" style={{ maxWidth: '100%', maxHeight: 300 }} />
              ))}
              <div>Likes: {post.likes?.length || 0}</div>
              <button onClick={() => handleLike(post._id, liked)} style={{ marginTop: 12, marginRight: 12, padding: '8px 18px', borderRadius: 8, background: liked ? 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)' : '#f0f4fa', color: liked ? '#fff' : '#222', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: liked ? '0 2px 8px #fc5c7d33' : 'none', transition: 'all 0.2s' }}>
                {liked ? 'Unlike' : 'Like'}
              </button>
              <button onClick={() => setOpenComments(c => ({ ...c, [post._id]: !c[post._id] }))} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, background: '#f0f4fa', color: '#222', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {openComments[post._id] ? 'Hide Comments' : 'Show Comments'}
              </button>
              {openComments[post._id] && (
                <CommentSection postId={post._id} token={token} user={user} postOwnerId={post.user?._id || post.user?.id} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Explore;