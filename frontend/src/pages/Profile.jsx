import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/api';

const Profile = () => {
  const { user, setUser, token } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (form.username && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
        setError('Username must be 3-20 characters, letters, numbers, or underscores.');
        setLoading(false);
        return;
      }
      const res = await updateProfile(form, token);
      setUser(res.data);
      setSuccess('Profile updated!');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Responsive max width
  const cardMaxWidth = 480;

  return (
    <div style={{
      minHeight: '100%',
      width: '100%',
      background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}>
      <div style={{
        width: '100%',
        maxWidth: cardMaxWidth,
        margin: '40px auto',
        borderRadius: 24,
        boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)',
        background: 'transparent',
        position: 'relative',
      }}>
        {/* Profile Header */}
        <div style={{
          height: 120,
          background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'relative',
        }}>
          {/* Avatar - overlapping */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 80,
            transform: 'translateX(-50%)',
            zIndex: 2,
            boxShadow: '0 4px 24px #b2e1ff55',
            borderRadius: '50%',
            border: '4px solid #fff',
            background: '#fff',
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={form.avatar}
              alt="avatar"
              style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover' }}
            />
            {editing && (
              <input
                type="text"
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="Avatar URL"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 128,
                  transform: 'translateX(-50%)',
                  width: 180,
                  border: '1.5px solid #e0e7ef',
                  borderRadius: 8,
                  padding: 6,
                  fontSize: 14,
                  background: '#fff',
                  boxShadow: '0 2px 8px #b2e1ff33',
                  zIndex: 3,
                }}
              />
            )}
          </div>
        </div>
        {/* Card for details */}
        <div style={{
          background: 'rgba(255,255,255,0.98)',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          boxShadow: '0 2px 16px #b2e1ff22',
          padding: '90px 32px 32px 32px',
          marginTop: 0,
          minHeight: 320,
        }}>
          {/* Name, username, date joined, edit button */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#222', letterSpacing: 1 }}>{form.name}</div>
            <div style={{ fontSize: 17, color: '#6a82fb', fontWeight: 600, marginTop: 2 }}>@{form.username || <span style={{ color: '#aaa' }}>not set</span>}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Joined {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                style={{
                  marginTop: 16,
                  background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 32px',
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: '0 2px 8px #b2e1ff55',
                  letterSpacing: 1,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)'}
                onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)'}
              >
                Edit Profile
              </button>
            )}
          </div>
          {/* Editable details */}
          <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#4a90e2', display: 'block', marginBottom: 4 }}>Display Name</label>
              {editing ? (
                <input type="text" name="name" value={form.name} onChange={handleChange} style={{ width: '100%', border: '1.5px solid #e0e7ef', borderRadius: 8, padding: 10, fontSize: 16, color: '#222', background: '#fff' }} />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>{form.name}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#4a90e2', display: 'block', marginBottom: 4 }}>Username</label>
              {editing ? (
                <input type="text" name="username" value={form.username} onChange={handleChange} style={{ width: '100%', border: '1.5px solid #e0e7ef', borderRadius: 8, padding: 10, fontSize: 16, color: '#222', background: '#fff' }} placeholder="Unique username" />
              ) : (
                <div style={{ fontSize: 16, color: '#222', fontWeight: 500 }}>@{form.username || <span style={{ color: '#aaa' }}>not set</span>}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#4a90e2', display: 'block', marginBottom: 4 }}>Bio / Status</label>
              {editing ? (
                <textarea name="bio" value={form.bio} onChange={handleChange} style={{ width: '100%', minHeight: 48, border: '1.5px solid #e0e7ef', borderRadius: 8, padding: 10, fontSize: 16, color: '#222', background: '#fff' }} maxLength={120} placeholder="Tell us about yourself..." />
              ) : (
                <div style={{ fontSize: 15, color: '#222', fontStyle: form.bio ? 'normal' : 'italic' }}>{form.bio || <span style={{ color: '#aaa' }}>No bio set</span>}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#4a90e2', display: 'block', marginBottom: 4 }}>Location</label>
              {editing ? (
                <input type="text" name="location" value={form.location} onChange={handleChange} style={{ width: '100%', border: '1.5px solid #e0e7ef', borderRadius: 8, padding: 10, fontSize: 16, color: '#222', background: '#fff' }} placeholder="Your location" />
              ) : (
                <div style={{ fontSize: 15, color: '#222', fontStyle: form.location ? 'normal' : 'italic' }}>{form.location || <span style={{ color: '#aaa' }}>No location set</span>}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#4a90e2', display: 'block', marginBottom: 4 }}>Date Joined</label>
              <div style={{ fontSize: 15, color: '#888' }}>{user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
            {editing && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: 12,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: '0 2px 8px #b2e1ff55',
                    letterSpacing: 1,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)'}
                  onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)'}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm({ name: user.name, avatar: user.avatar, username: user.username || '', bio: user.bio || '', location: user.location || '' }); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1,
                    background: '#eee',
                    border: 'none',
                    borderRadius: 8,
                    padding: 12,
                    fontWeight: 700,
                    color: '#4a90e2',
                    letterSpacing: 1,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile; 