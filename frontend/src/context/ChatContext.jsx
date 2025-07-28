import React, { createContext, useState } from 'react';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);

  return (
    <ChatContext.Provider value={{ chats, setChats, currentChat, setCurrentChat }}>
      {children}
    </ChatContext.Provider>
  );
};
