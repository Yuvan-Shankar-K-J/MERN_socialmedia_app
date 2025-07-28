import React from 'react';

const ChatList = ({ chats, currentChat, setCurrentChat, user }) => (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {chats.map(chat => (
      <li key={chat._id} style={{ padding: 5, cursor: 'pointer', background: currentChat?._id === chat._id ? '#eee' : 'transparent' }} onClick={() => setCurrentChat(chat)}>
        {chat.isGroup ? chat.name : chat.users.filter(u => u._id !== user.id)[0]?.name}
      </li>
    ))}
  </ul>
);

export default ChatList;
