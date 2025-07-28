import React from 'react';

const MessageInput = ({ input, setInput, handleSend }) => (
  <form onSubmit={handleSend} style={{ 
    display: 'flex', 
    gap: 12, 
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    margin: '0 16px 16px 16px',
    boxShadow: '0 2px 12px rgba(80,120,200,0.08)',
    border: '1px solid #e0e7ef'
  }}>
    <input 
      value={input} 
      onChange={e => setInput(e.target.value)} 
      placeholder="Type a message..." 
      style={{ 
        flex: 1, 
        padding: '12px 16px',
        border: '2px solid #e0e7ef',
        borderRadius: 12,
        fontSize: 16,
        outline: 'none',
        transition: 'all 0.3s ease',
        background: '#fff',
        color: '#222',
        '&:focus': {
          borderColor: '#4a90e2',
          boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)'
        }
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#4a90e2';
        e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e0e7ef';
        e.target.style.boxShadow = 'none';
      }}
    />
    <button 
      type="submit"
      disabled={!input.trim()}
      style={{ 
        padding: '12px 24px',
        background: input.trim() ? 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)' : '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 700,
        cursor: input.trim() ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s ease',
        boxShadow: input.trim() ? '0 2px 8px rgba(106, 130, 251, 0.3)' : 'none'
      }}
    >
      Send
    </button>
  </form>
);

export default MessageInput;
