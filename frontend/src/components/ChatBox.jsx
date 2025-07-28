import React, { useRef, useEffect } from 'react';
import MessageInput from './MessageInput';

const ChatBox = ({ messages, input, setInput, handleSend, user, currentChat, loading = false }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', borderRadius: 24, margin: 24, boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.08)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'transparent' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666',
            fontSize: 16
          }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#888',
            fontSize: 16,
            textAlign: 'center'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const currentUserId = user.id || user._id;
            const senderId = msg.sender._id || msg.sender.id;
            const isOwnMessage = senderId === currentUserId;
            const showSenderName = currentChat?.isGroup && !isOwnMessage;
            
            return (
              <div
                key={idx}
                style={{
                  marginBottom: 18,
                  display: 'flex',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}
              >
                <img
                  src={msg.sender.avatar || 'https://via.placeholder.com/36'}
                  alt={msg.sender.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    margin: isOwnMessage ? '0 0 0 14px' : '0 14px 0 0',
                    boxShadow: '0 2px 8px #a8edea55',
                    border: '2px solid #a8edea',
                    background: '#fff',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    background: isOwnMessage
                      ? 'linear-gradient(135deg, #a8edea 0%, #f9f9f9 100%)'
                      : 'linear-gradient(135deg, #f9f9f9 0%, #e3f0ff 100%)',
                    color: '#222',
                    borderRadius: 22,
                    padding: '14px 22px',
                    maxWidth: '60%',
                    fontWeight: 500,
                    fontSize: 16,
                    boxShadow: '0 2px 8px rgba(80,120,200,0.07)',
                    wordBreak: 'break-word',
                    borderTopRightRadius: isOwnMessage ? 8 : 22,
                    borderTopLeftRadius: isOwnMessage ? 22 : 8,
                    borderBottomRightRadius: 22,
                    borderBottomLeftRadius: 22,
                    marginLeft: isOwnMessage ? 0 : 4,
                    marginRight: isOwnMessage ? 4 : 0,
                  }}
                >
                  {showSenderName && (
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: 14, 
                      color: '#4a90e2', 
                      marginBottom: 4,
                      textAlign: 'left'
                    }}>
                      {msg.sender.name || msg.sender.email}
                    </div>
                  )}
                  <div style={{ marginBottom: 4 }}>
                    {msg.content}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#666', 
                    textAlign: isOwnMessage ? 'right' : 'left',
                    marginTop: 4
                  }}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ background: 'linear-gradient(90deg, #e3f0ff 0%, #f9f9f9 100%)', borderTop: '1px solid #e0e7ef', padding: 18 }}>
        <MessageInput input={input} setInput={setInput} handleSend={handleSend} />
      </div>
    </div>
  );
};

export default ChatBox;
