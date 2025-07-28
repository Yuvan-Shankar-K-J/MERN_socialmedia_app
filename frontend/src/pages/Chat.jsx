import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { getChats, getOneToOneMessages, sendMessage, searchUsers, createChat, getUserProfile } from '../services/api';
import io from 'socket.io-client';
import ChatBox from '../components/ChatBox';

const SOCKET_URL = 'http://localhost:4000';

const Chat = () => {
  const { user, token } = useContext(AuthContext);
  const { chats, setChats, currentChat, setCurrentChat } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef();
  const searchRef = useRef();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      getChats(token)
        .then(res => {
          // Filter only one-to-one chats (not groups)
          const individualChats = res.data.filter(chat => !chat.isGroup);
          setChats(individualChats);
          setError('');
        })
        .catch(err => {
          console.error('Error loading chats:', err);
          setError('Failed to load chats');
        })
        .finally(() => setLoading(false));
    }
  }, [token, setChats]);

  useEffect(() => {
    if (currentChat && token) {
      setLoadingMessages(true);
      // Use the new one-to-one messages endpoint
      getOneToOneMessages(currentChat._id, token)
        .then(res => {
          console.log('One-to-one messages:', res.data);
          setMessages(res.data);
          setError('');
        })
        .catch(err => {
          console.error('Error loading messages:', err);
          setError('Failed to load messages');
        })
        .finally(() => setLoadingMessages(false));
      
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

  // Click outside handler to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search users when query changes
  useEffect(() => {
    const searchUsersInDB = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchUsers(searchQuery, token);
        // Filter out current user and users already in chats
        const filteredResults = response.data.filter(searchUser => {
          const currentUserId = user.id || user._id;
          const searchUserId = searchUser._id;
          const isNotCurrentUser = searchUserId !== currentUserId;
          const isNotAlreadyInChat = !chats.some(chat => 
            chat.users.some(chatUser => (chatUser._id || chatUser.id) === searchUserId)
          );
          return isNotCurrentUser && isNotAlreadyInChat;
        });
        setSearchResults(filteredResults);
        setShowSearchResults(true);
        setError('');
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        setError('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsersInDB, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, token, user, chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;
    
    const messageContent = input.trim();
    setInput('');
    
    // Optimistically add the message to the UI
    const optimisticMsg = {
      content: messageContent,
      sender: user,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const msgData = { chatId: currentChat._id, content: messageContent };
      const res = await sendMessage(msgData, token);
      // Replace the optimistic message with the real one from backend (if needed)
      setMessages(prev => {
        // Remove the last optimistic message and add the real one
        const updated = prev.slice(0, -1);
        return [...updated, { ...res.data, sender: res.data.sender || user }];
      });
      socketRef.current.emit('sendMessage', { chatId: currentChat._id, message: { ...res.data, sender: res.data.sender || user } });
      setError('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Restore the input if sending failed
      setInput(messageContent);
    }
  };

  const handleStartChat = async (selectedUser) => {
    try {
      const currentUserId = user.id || user._id;
      const selectedUserId = selectedUser._id;
      
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.users.some(chatUser => (chatUser._id || chatUser.id) === selectedUserId)
      );

      if (existingChat) {
        setCurrentChat(existingChat);
      } else {
        // Create new chat
        const res = await createChat({ 
          userIds: [currentUserId, selectedUserId], 
          isGroup: false 
        }, token);
        
        const newChat = res.data;
        setChats(prev => [...prev, newChat]);
        setCurrentChat(newChat);
      }

      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setError('');
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start chat');
    }
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    try {
      const response = await searchUsers(searchQuery, token);
      console.log('Manual search response:', response.data);
      const filteredResults = response.data.filter(searchUser => {
        const isNotCurrentUser = searchUser._id !== user.id && searchUser._id !== user._id;
        const isNotAlreadyInChat = !chats.some(chat => 
          chat.users.some(chatUser => chatUser._id === searchUser._id)
        );
        return isNotCurrentUser && isNotAlreadyInChat;
      });
      setSearchResults(filteredResults);
      setShowSearchResults(true);
      setError('');
    } catch (error) {
      console.error('Manual search error:', error);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewProfile = async (userId) => {
    setProfileModalOpen(true);
    setProfileLoading(true);
    setProfileError('');
    setProfileUser(null);
    try {
      const res = await getUserProfile(userId, token);
      setProfileUser(res.data);
    } catch (err) {
      setProfileError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Modified: open user search modal from Add People button
  const openUserSearchModal = () => {
    setShowUserSearchModal(true);
    setShowSearchResults(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add a filteredChats variable to filter chats based on searchQuery
  const filteredChats = searchQuery.trim().length > 0
    ? chats.filter(chat => {
        const currentUserId = user.id || user._id;
        const otherUser = chat.users.find(u => (u._id || u.id) !== currentUserId);
        const search = searchQuery.toLowerCase();
        return (
          (otherUser?.name && otherUser.name.toLowerCase().includes(search)) ||
          (otherUser?.email && otherUser.email.toLowerCase().includes(search))
        );
      })
    : chats;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)' }}>
      {/* Sidebar */}
      <div style={{ width: 320, borderRight: '2px solid #e0e7ef', background: 'rgba(255,255,255,0.95)', color: '#222', padding: 0, display: 'flex', flexDirection: 'column', borderTopLeftRadius: 32, borderBottomLeftRadius: 32, boxShadow: '2px 0 12px #e0e7ef55' }}>
        {/* Header */}
        <div style={{ padding: 24, borderBottom: '2px solid #e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, #e3f0ff 0%, #f9f9f9 100%)', borderTopLeftRadius: 32 }}>
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, color: '#4a90e2', textShadow: '0 2px 8px #b2e1ff' }}>ChatApp</span>
          <span style={{ color: '#4a90e2', fontSize: 14, fontWeight: 600 }}>Individual Chats</span>
        </div>
        {/* Persistent Search Bar */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e0e7ef', background: '#f9f9f9' }}>
          <input
            type="text"
            placeholder="Search chats or users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e0e7ef',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none',
              background: 'white',
              color: '#222',
              marginBottom: 0,
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyPress={e => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
          />
        </div>
        {/* Add People Button */}
        <div style={{ padding: '16px 16px 0 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={openUserSearchModal}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #a8edea55',
            }}
          >
            + Add People
          </button>
        </div>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: 8,
            margin: '8px 16px',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}
        {/* Search Bar (hidden in sidebar, now in modal) */}
        {/* Chat List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <h3 style={{ color: '#4a90e2', marginBottom: 16 }}>Individual Chats</h3>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', fontSize: 14, marginTop: 20 }}>
              Loading chats...
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredChats.map(chat => {
                // Always show the other user (receiver) in the chat
                const currentUserId = user.id || user._id;
                const otherUser = chat.users.find(u => (u._id || u.id) !== currentUserId);
                return (
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
                    <img
                      src={otherUser?.avatar || 'https://via.placeholder.com/36'}
                      alt={otherUser?.name}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #a8edea', background: '#fff', objectFit: 'cover', marginRight: 8 }}
                    />
                    {otherUser?.name || otherUser?.email}
                  </li>
                );
              })}
            </ul>
          )}
          {filteredChats.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 16, marginTop: 40 }}>
              No chats found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
      {/* Main chat area ... */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', background: 'linear-gradient(135deg, #f9f9f9 0%, #e3f0ff 100%)', borderTopRightRadius: 32, borderBottomRightRadius: 32, boxShadow: '-2px 0 12px #e0e7ef33' }}>
        {currentChat ? (
          <ChatBox 
            messages={messages} 
            input={input} 
            setInput={setInput} 
            handleSend={handleSend} 
            user={user} 
            currentChat={currentChat}
            loading={loadingMessages}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#4a90e2', fontSize: 32, fontWeight: 700, marginTop: 80, textShadow: '0 2px 8px #a8edea' }}>
            Select a chat to start messaging!
          </div>
        )}
      </div>
      {/* User Search Modal */}
      {showUserSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setShowUserSearchModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.18)',
              padding: 36,
              minWidth: 340,
              maxWidth: 400,
              width: '100%',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUserSearchModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <div style={{ marginBottom: 18, fontWeight: 700, fontSize: 20, color: '#4a90e2', textAlign: 'center' }}>Start a New Chat</div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '2px solid #e0e7ef',
                  borderRadius: 12,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  cursor: 'text',
                  color: '#222',
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyPress={e => {
                  if (e.key === 'Enter') handleSearchSubmit();
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a90e2', fontSize: 16 }}>🔍</span>
              {isSearching && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a90e2', fontSize: 14 }}>⏳</span>
              )}
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                background: 'white',
                border: '1px solid #e0e7ef',
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                maxHeight: 200,
                overflowY: 'auto',
                marginTop: 4
              }}>
                <div style={{ padding: '8px 16px', fontSize: 12, color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                  Found {searchResults.length} user(s)
                </div>
                {searchResults.map(searchUser => (
                  <div
                    key={searchUser._id}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s ease',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={searchUser.avatar || 'https://via.placeholder.com/32'}
                        alt={searchUser.name}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                          {searchUser.name || searchUser.email}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {searchUser.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleViewProfile(searchUser._id)}
                        style={{
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: 4
                        }}
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => { handleStartChat(searchUser); setShowUserSearchModal(false); }}
                        style={{
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          color: '#4a90e2',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showSearchResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
              <div style={{
                background: 'white',
                border: '1px solid #e0e7ef',
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                marginTop: 4,
                padding: '16px',
                textAlign: 'center',
                color: '#666'
              }}>
                No users found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {profileModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.18)',
              padding: 36,
              minWidth: 340,
              maxWidth: 400,
              width: '100%',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setProfileModalOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            {profileLoading ? (
              <div style={{ textAlign: 'center', color: '#4a90e2', fontSize: 18 }}>Loading...</div>
            ) : profileError ? (
              <div style={{ textAlign: 'center', color: 'red', fontSize: 16 }}>{profileError}</div>
            ) : profileUser ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={profileUser.avatar || 'https://via.placeholder.com/80'}
                  alt={profileUser.name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '3px solid #a8edea', boxShadow: '0 2px 8px #a8edea55' }}
                />
                <div style={{ fontWeight: 900, fontSize: 22, color: '#4a90e2', marginBottom: 4 }}>{profileUser.name}</div>
                <div style={{ fontSize: 15, color: '#6a82fb', fontWeight: 600, marginBottom: 2 }}>@{profileUser.username || <span style={{ color: '#aaa' }}>not set</span>}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{profileUser.email}</div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 8 }}>{profileUser.bio}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{profileUser.location}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Joined {profileUser.dateJoined ? new Date(profileUser.dateJoined).toLocaleDateString() : profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
