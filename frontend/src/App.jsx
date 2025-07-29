import React, { useContext, useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { AuthContext } from './context/AuthContext';
import { ChatContext } from './context/ChatContext';
import { getChats, getGroupMessages, sendMessage, createChat, addUserToGroup, searchUsers, removeUserFromGroup, getNotifications, markNotificationRead } from './services/api';
import io from 'socket.io-client';
import ChatBox from './components/ChatBox';
import UserList from './components/UserList';
import Feed from './pages/Feed';
import Explore from './pages/Explore';

const SOCKET_URL = 'http://localhost:4000';

const NotificationBell = () => {
  const { token, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef();

  // Load notifications when component mounts or when opened
  const loadNotifications = async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const response = await getNotifications(token);
      console.log('Loaded notifications:', response.data);
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token, user]);

  useEffect(() => {
    if (token && user) {
      console.log('Connecting to Socket.IO with token and user:', user.id);
      socketRef.current = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` }
      });

      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected successfully');
      });

      socketRef.current.on('notification', (newNotification) => {
        console.log('Received notification:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token, user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      loadNotifications(); // Refresh notifications when opening
    }
  };
  
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id, token);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div style={{ position: 'relative', marginRight: 24 }}>
      <button onClick={handleOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
          <path d="M12 2C13.1 2 14 2.9 14 4V5.29C17.03 6.11 19 8.73 19 12V17L21 19V20H3V19L5 17V12C5 8.73 6.97 6.11 10 5.29V4C10 2.9 10.9 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" fill="#333" stroke="#333" strokeWidth="0.5"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, background: 'red', color: 'white', borderRadius: '50%', fontSize: 10, padding: '1px 4px', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, background: '#fff', border: '1px solid #ccc', borderRadius: 8, minWidth: 300, zIndex: 100, boxShadow: '0 2px 12px #0001', maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ background: '#6a82fb', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: 12 }}>{unreadCount} new</span>
            )}
          </div>
          {loading ? (
            <div style={{ padding: 12, textAlign: 'center', color: '#666' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', color: '#666' }}>No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n._id} onClick={() => handleMarkRead(n._id)} style={{ 
                padding: 12, 
                background: n.read ? '#f7f7f7' : '#e6f0ff', 
                borderBottom: '1px solid #eee', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}>
                <span style={{ fontWeight: n.read ? 400 : 700, display: 'block', marginBottom: 4 }}>
                  {n.type === 'like' && <span>❤️ <b>{n.fromUser?.name || 'Someone'}</b> liked your post</span>}
                  {n.type === 'comment' && (
                    <span>💬 <b>{n.fromUser?.name || 'Someone'}</b> commented: <span style={{ fontStyle: 'italic', color: '#333' }}>"{n.comment?.text || ''}"</span></span>
                  )}
                  {n.type === 'follow' && <span>➕ <b>{n.fromUser?.name || 'Someone'}</b> followed you</span>}
                  {n.type === 'message' && <span>✉️ <b>{n.fromUser?.name || 'Someone'}</b> sent you a message</span>}
                  {n.type === 'mention' && <span>@ <b>{n.fromUser?.name || 'Someone'}</b> mentioned you</span>}
                </span>
                <div style={{ fontSize: 11, color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Groups = () => {
  const { user, token } = useContext(AuthContext);
  const { chats, setChats, currentChat, setCurrentChat } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showGroupSearch, setShowGroupSearch] = useState(false);
  const socketRef = useRef();
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isProcessingGroupAction, setIsProcessingGroupAction] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (token) {
      getChats(token).then(res => {
        // Filter only group chats
        const groupChats = res.data.filter(chat => chat.isGroup);
        setChats(groupChats);
        setFilteredGroups(groupChats);
      });
    }
  }, [token, setChats]);

  useEffect(() => {
    if (currentChat && token) {
      // Use the new group messages endpoint
      getGroupMessages(currentChat._id, token).then(res => {
        console.log('Group messages:', res.data);
        setMessages(res.data);
      });
      socketRef.current.emit('joinChat', currentChat._id);
    }
  }, [currentChat, token]);

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('receiveMessage', (msg) => {
      const currentUserId = user.id || user._id;
      const senderId = msg.sender._id || msg.sender.id || msg.sender;
      if (senderId === currentUserId) return; // Ignore own messages
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socketRef.current.off('receiveMessage');
    };
  }, [user]);

  // Filter groups based on search query
  useEffect(() => {
    if (groupSearchQuery.trim().length === 0) {
      setFilteredGroups(chats);
    } else {
      const filtered = chats.filter(group => 
        group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groupSearchQuery, chats]);

  // Fetch all users for group creation
  useEffect(() => {
    if (token) {
      fetch('http://localhost:4000/api/chats/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          // Flatten all users from all chats, remove duplicates and self
          const currentUserId = user.id || user._id;
          const users = data
            .flatMap(chat => chat.users)
            .filter(u => (u._id || u.id) !== currentUserId)
            .reduce((acc, u) => {
              const userId = u._id || u.id;
              if (!acc.find(x => (x._id || x.id) === userId)) acc.push(u);
              return acc;
            }, []);
          setAllUsers(users);
        })
        .catch(error => {
          console.error('Error fetching users for group creation:', error);
        });
    }
  }, [token, user]);

  // Search users in the database for adding to group
  useEffect(() => {
    if (!showAddMembers || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setIsUserSearching(true);
    searchUsers(userSearchQuery, token)
      .then(res => {
        // Exclude users already in the group
        const groupUserIds = groupDetails?.users?.map(u => u._id || u.id) || [];
        const filtered = res.data.filter(u => !groupUserIds.includes(u._id));
        setUserSearchResults(filtered);
      })
      .catch(() => setUserSearchResults([]))
      .finally(() => setIsUserSearching(false));
  }, [userSearchQuery, token, groupDetails, showAddMembers]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;
    
    try {
      const msgData = { chatId: currentChat._id, content: input };
      const res = await sendMessage(msgData, token);
      setMessages(prev => [...prev, { ...res.data, sender: user }]);
      socketRef.current.emit('sendMessage', { chatId: currentChat._id, message: { ...res.data, sender: user } });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!groupName.trim()) {
      setGroupError('Group name is required.');
      return;
    }
    
    try {
      const currentUserId = user.id || user._id;
      const userIds = [currentUserId];
      const res = await createChat({ userIds, isGroup: true, name: groupName }, token);
      setChats(prev => [...prev, res.data]);
      setFilteredGroups(prev => [...prev, res.data]);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedUserIds([]);
      setCurrentChat(res.data);
      setGroupDetails(res.data);
    } catch (err) {
      setGroupError(err.response?.data?.message || 'Failed to create group.');
    }
  };

  const handleAddMembers = async () => {
    try {
      for (const userId of selectedUserIds) {
        await addUserToGroup({ chatId: groupDetails._id, userId }, token);
      }
      // Refresh group details
      const updated = { ...groupDetails };
      updated.users = [...groupDetails.users, ...allUsers.filter(u => selectedUserIds.includes(u._id || u.id))];
      setGroupDetails(updated);
      setSelectedUserIds([]);
      setShowAddMembers(false);
      // Optionally refresh chats
      getChats(token).then(res => {
        const groupChats = res.data.filter(chat => chat.isGroup);
        setChats(groupChats);
        setFilteredGroups(groupChats);
      });
    } catch (error) {
      console.error('Error adding members to group:', error);
    }
  };

  // Handler for deleting group (admin only)
  const handleDeleteGroup = async () => {
    if (!groupDetails) return;
    setIsProcessingGroupAction(true);
    try {
      await fetch('http://localhost:4000/api/chats/group/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: groupDetails._id })
      });
      setShowGroupInfo(false);
      setCurrentChat(null);
      setGroupDetails(null);
      // Refresh group list
      getChats(token).then(res => {
        const groupChats = res.data.filter(chat => chat.isGroup);
        setChats(groupChats);
        setFilteredGroups(groupChats);
      });
    } catch (err) {
      alert('Failed to delete group.');
    } finally {
      setIsProcessingGroupAction(false);
    }
  };

  // Handler for leaving group (member only)
  const handleLeaveGroup = async () => {
    if (!groupDetails) return;
    setIsProcessingGroupAction(true);
    try {
      await removeUserFromGroup({ chatId: groupDetails._id, userId: user.id || user._id }, token);
      setShowGroupInfo(false);
      setCurrentChat(null);
      setGroupDetails(null);
      // Refresh group list
      getChats(token).then(res => {
        const groupChats = res.data.filter(chat => chat.isGroup);
        setChats(groupChats);
        setFilteredGroups(groupChats);
      });
    } catch (err) {
      alert('Failed to leave group.');
    } finally {
      setIsProcessingGroupAction(false);
    }
  };

  const groupChats = chats.filter(chat => chat.isGroup);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)' }}>
      <div style={{ width: 320, borderRight: '2px solid #e0e7ef', background: 'rgba(255,255,255,0.95)', color: '#222', padding: 0, display: 'flex', flexDirection: 'column', borderTopLeftRadius: 32, borderBottomLeftRadius: 32, boxShadow: '2px 0 12px #e0e7ef55' }}>
        <div style={{ padding: 24, borderBottom: '2px solid #e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, #e3f0ff 0%, #f9f9f9 100%)', borderTopLeftRadius: 32 }}>
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, color: '#4a90e2', textShadow: '0 2px 8px #b2e1ff' }}>Groups</span>
          <button onClick={() => setShowGroupModal(true)} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#4a90e2', border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px #a8edea55' }}>+ Group</button>
        </div>
        
        {/* Group Search Bar */}
        <div style={{ padding: 16, borderBottom: '1px solid #e0e7ef' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search groups..."
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '2px solid #e0e7ef',
                borderRadius: 12,
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'white',
                color: '#4a90e2',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a90e2', fontSize: 16 }}>🔍</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <h3 style={{ color: '#4a90e2', marginBottom: 16 }}>Group Chats</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredGroups.map(chat => (
              <li
                key={chat._id}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  background: currentChat?._id === chat._id ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' : 'transparent',
                  color: currentChat?._id === chat._id ? '#222' : '#4a90e2',
                  borderRadius: 12,
                  marginBottom: 8,
                  fontWeight: 600,
                  fontSize: 18,
                  boxShadow: currentChat?._id === chat._id ? '0 2px 8px #a8edea55' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onClick={() => setCurrentChat(chat)}
              >
                <span style={{ fontSize: 28, marginRight: 8 }}>👥</span>
                <div style={{ flex: 1 }}>
                  <div>{chat.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {chat.users?.length || 0} members
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setGroupDetails(chat); setShowGroupInfo(true); }}
                  style={{ background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                >
                  Info
                </button>
                {currentChat?._id === chat._id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupDetails(chat);
                      setShowAddMembers(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add Members
                  </button>
                )}
              </li>
            ))}
          </ul>
          {filteredGroups.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 16, marginTop: 40 }}>
              {groupSearchQuery ? 'No groups found matching your search.' : 'No groups yet. Create your first group!'}
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', background: 'linear-gradient(135deg, #f9f9f9 0%, #e3f0ff 100%)', borderTopRightRadius: 32, borderBottomRightRadius: 32, boxShadow: '-2px 0 12px #e0e7ef33' }}>
        {currentChat ? (
          <ChatBox messages={messages} input={input} setInput={setInput} handleSend={handleSend} user={user} currentChat={currentChat} />
        ) : (
          <div style={{ textAlign: 'center', color: '#4a90e2', fontSize: 32, fontWeight: 700, marginTop: 80, textShadow: '0 2px 8px #a8edea' }}>
            Select a group or create one to start messaging!
          </div>
        )}
      </div>
      {showGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(168,237,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateGroup} style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 400, boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: 24 }}>Create Group</h2>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group Name"
              style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, border: '1px solid #a8edea', fontSize: 16, color: '#222', background: '#fff' }}
              required
            />
            {groupError && <div style={{ color: 'red', marginBottom: 12 }}>{groupError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowGroupModal(false)} style={{ background: '#eee', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Create</button>
            </div>
          </form>
        </div>
      )}
      {groupDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(168,237,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 400, boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: 12 }}>Group Details</h2>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Name:</b> {groupDetails.name}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Group ID:</b> {groupDetails._id}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Admin:</b> {groupDetails.admin?.name || groupDetails.admin?.email || 'N/A'}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Members:</b></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
              {groupDetails.users && groupDetails.users.map(u => {
                const isAdmin = groupDetails.admin && ((u._id && u._id.toString()) === (groupDetails.admin._id && groupDetails.admin._id.toString()) || (u.id && u.id.toString()) === (groupDetails.admin.id && groupDetails.admin.id.toString()));
                return (
                  <li key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <img src={u.avatar || 'https://via.placeholder.com/24'} alt={u.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 600, color: '#222' }}>{u.name || u.email}</span>
                    {isAdmin && (
                      <span style={{ color: '#fc5c7d', fontWeight: 700, marginLeft: 6 }}>(admin)</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <button onClick={() => setShowAddMembers(true)} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>Add Members</button>
            <button onClick={() => setGroupDetails(null)} style={{ background: '#eee', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginLeft: 12 }}>Close</button>
          </div>
        </div>
      )}
      {showAddMembers && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(168,237,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 500, maxWidth: 600, boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: 12 }}>Add Members to "{groupDetails?.name}"</h2>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search users to add..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e7ef',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  color: '#222',
                  background: '#fff',
                }}
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, border: '1px solid #e0e7ef', borderRadius: 8 }}>
              {isUserSearching ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>Searching...</div>
              ) : userSearchQuery.trim().length >= 2 ? (
                userSearchResults.length > 0 ? (
                  userSearchResults.map(user => (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: '1px solid #f0f0f0',
                        background: selectedUserIds.includes(user._id) ? '#f8f9fa' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => toggleUser(user._id)}
                        style={{ marginRight: 8, accentColor: '#4a90e2' }}
                      />
                      <img
                        src={user.avatar || 'https://via.placeholder.com/32'}
                        alt={user.name}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                          {user.name || user.email}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>No users found to add</div>
                )
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>Type at least 2 characters to search</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: '#666' }}>
                {selectedUserIds.length} user(s) selected
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowAddMembers(false)} style={{ background: '#eee', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleAddMembers} disabled={selectedUserIds.length === 0} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Add Selected</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Group Info Modal */}
      {showGroupInfo && groupDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(168,237,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 400, maxWidth: 500, boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: 12 }}>Group Info</h2>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Name:</b> {groupDetails.name}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Group ID:</b> {groupDetails._id}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Admin:</b> {groupDetails.admin?.name || groupDetails.admin?.email || 'N/A'}</div>
            <div style={{ marginBottom: 8, color: '#222' }}><b>Members:</b></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
              {groupDetails.users && groupDetails.users.map(u => {
                const isAdmin = groupDetails.admin && ((u._id && u._id.toString()) === (groupDetails.admin._id && groupDetails.admin._id.toString()) || (u.id && u.id.toString()) === (groupDetails.admin.id && groupDetails.admin.id.toString()));
                return (
                  <li key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <img src={u.avatar || 'https://via.placeholder.com/24'} alt={u.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 600, color: '#222' }}>{u.name || u.email}</span>
                    {isAdmin && (
                      <span style={{ color: '#fc5c7d', fontWeight: 700, marginLeft: 6 }}>(admin)</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowGroupInfo(false)} style={{ background: '#eee', color: '#4a90e2', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              {(groupDetails.admin && (groupDetails.admin._id === (user.id || user._id) || groupDetails.admin.id === (user.id || user._id))) ? (
                <button onClick={() => { if(window.confirm('Are you sure you want to delete this group?')) handleDeleteGroup(); }} disabled={isProcessingGroupAction} style={{ background: 'linear-gradient(135deg, #fc5c7d 0%, #a8edea 100%)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Delete Group</button>
              ) : (
                <button onClick={() => { if(window.confirm('Are you sure you want to leave this group?')) handleLeaveGroup(); }} disabled={isProcessingGroupAction} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fc5c7d 100%)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Leave Group</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { to: '/chat', label: 'Chats', icon: '💬' },
    { to: '/groups', label: 'Groups', icon: '👥' },
    { to: '/feed', label: 'Feed', icon: '🏠' },
    { to: '/explore', label: 'Explore', icon: '🌎' },
    { to: '/profile', label: 'Profile', icon: '🙍‍♂️' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];
  return (
    <div style={{
      width: 100,
      height: '100vh',
      background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
      borderRadius: 32,
      margin: 0,
      boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 32,
      paddingBottom: 32,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ fontWeight: 900, fontSize: 28, color: '#6a82fb', marginBottom: 40, letterSpacing: 1, textShadow: '0 2px 8px #b2e1ff55' }}>✨</div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {navItems.slice(0, 4).map(item => (
            <Link key={item.to} to={item.to} style={{
              textDecoration: 'none',
              color: location.pathname === item.to ? '#fff' : '#6a82fb',
              background: location.pathname === item.to ? 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)' : 'transparent',
              borderRadius: 20,
              padding: '18px 0',
              width: 64,
              textAlign: 'center',
              marginBottom: 20,
              fontWeight: 700,
              fontSize: 22,
              boxShadow: location.pathname === item.to ? '0 2px 8px #fc5c7d33' : 'none',
              transition: 'all 0.2s',
            }}>{item.icon}<div style={{ fontSize: 13 }}>{item.label}</div></Link>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {navItems.slice(4).map(item => (
            <Link key={item.to} to={item.to} style={{
              textDecoration: 'none',
              color: location.pathname === item.to ? '#fff' : '#6a82fb',
              background: location.pathname === item.to ? 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)' : 'transparent',
              borderRadius: 20,
              padding: '18px 0',
              width: 64,
              textAlign: 'center',
              marginBottom: 20,
              fontWeight: 700,
              fontSize: 22,
              boxShadow: location.pathname === item.to ? '0 2px 8px #fc5c7d33' : 'none',
              transition: 'all 0.2s',
            }}>{item.icon}<div style={{ fontSize: 13 }}>{item.label}</div></Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px 0 16px', background: 'transparent' }}>
        <NotificationBell />
      </div>
      <Outlet />
    </div>
  </div>
);

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/chat" />} />
        {user && (
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/chat" />} />
            <Route path="chat" element={<Chat />} />
            <Route path="groups" element={<Groups />} />
            <Route path="feed" element={<Feed />} />
            <Route path="explore" element={<Explore />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/chat" />} />
          </Route>
        )}
        {!user && <Route path="*" element={<Navigate to="/login" />} />}
      </Routes>
    </Router>
  );
};

export default App;
