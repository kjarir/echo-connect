import React, { createContext, useContext, useState, useCallback } from "react";
import { Message, Chat } from "@/types/chat";
import { mockMessages, mockChats } from "@/data/mockData";

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
  sendMessage: (chatId: string, content: string) => void;
  addReaction: (messageId: string, chatId: string, emoji: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const sendMessage = useCallback((chatId: string, content: string) => {
    const newMsg: Message = {
      id: `m${Date.now()}`,
      chatId,
      senderId: "1",
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
      type: "text",
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));

    setChats(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, lastMessage: newMsg } : c
      )
    );

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.map(m => m.id === newMsg.id ? { ...m, status: "delivered" as const } : m) || [],
      }));
    }, 1000);
  }, []);

  const addReaction = useCallback((messageId: string, chatId: string, emoji: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(m =>
        m.id === messageId
          ? { ...m, reactions: [...(m.reactions || []), { emoji, userId: "1" }] }
          : m
      ) || [],
    }));
  }, []);

  return (
    <ChatContext.Provider value={{ chats, messages, activeChat, setActiveChat, sendMessage, addReaction }}>
      {children}
    </ChatContext.Provider>
  );
};
