import { User, Message, Chat, Status } from "@/types/chat";

export const mockUsers: User[] = [
  { id: "1", name: "You", avatar: "", bio: "Hey there! I'm using BrutalChat", online: true, lastSeen: new Date().toISOString() },
  { id: "2", name: "Sarah Chen", avatar: "", bio: "Designer & maker", online: true, lastSeen: new Date().toISOString() },
  { id: "3", name: "Marcus Johnson", avatar: "", bio: "Building cool stuff", online: false, lastSeen: new Date(Date.now() - 3600000).toISOString() },
  { id: "4", name: "Aisha Patel", avatar: "", bio: "Coffee & code", online: true, lastSeen: new Date().toISOString() },
  { id: "5", name: "Tom Wilson", avatar: "", bio: "🎵 Music is life", online: false, lastSeen: new Date(Date.now() - 7200000).toISOString() },
  { id: "6", name: "Luna Rodriguez", avatar: "", bio: "Exploring the world", online: true, lastSeen: new Date().toISOString() },
];

export const mockMessages: Record<string, Message[]> = {
  "2": [
    { id: "m1", chatId: "2", senderId: "2", content: "Hey! Did you see the new design system?", timestamp: new Date(Date.now() - 600000).toISOString(), status: "read", type: "text" },
    { id: "m2", chatId: "2", senderId: "1", content: "Yes! The neurobrutalist style is 🔥", timestamp: new Date(Date.now() - 540000).toISOString(), status: "read", type: "text" },
    { id: "m3", chatId: "2", senderId: "2", content: "Right?! Bold borders, hard shadows, chunky buttons. Love it.", timestamp: new Date(Date.now() - 480000).toISOString(), status: "read", type: "text" },
    { id: "m4", chatId: "2", senderId: "1", content: "It's like brutalism met a candy shop 😂", timestamp: new Date(Date.now() - 420000).toISOString(), status: "delivered", type: "text" },
    { id: "m5", chatId: "2", senderId: "2", content: "Haha perfect description! Want to collab on the chat app?", timestamp: new Date(Date.now() - 60000).toISOString(), status: "read", type: "text" },
  ],
  "3": [
    { id: "m6", chatId: "3", senderId: "3", content: "The API is ready for testing", timestamp: new Date(Date.now() - 1800000).toISOString(), status: "read", type: "text" },
    { id: "m7", chatId: "3", senderId: "1", content: "Awesome, I'll check it out today", timestamp: new Date(Date.now() - 1700000).toISOString(), status: "delivered", type: "text" },
  ],
  "4": [
    { id: "m8", chatId: "4", senderId: "4", content: "Meeting at 3pm?", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "read", type: "text" },
    { id: "m9", chatId: "4", senderId: "1", content: "Works for me! ☕", timestamp: new Date(Date.now() - 3500000).toISOString(), status: "read", type: "text" },
    { id: "m10", chatId: "4", senderId: "4", content: "Great, see you then!", timestamp: new Date(Date.now() - 3400000).toISOString(), status: "read", type: "text" },
  ],
  "5": [
    { id: "m11", chatId: "5", senderId: "5", content: "Check out this playlist 🎵", timestamp: new Date(Date.now() - 86400000).toISOString(), status: "read", type: "text" },
  ],
  "6": [
    { id: "m12", chatId: "6", senderId: "6", content: "Just landed in Tokyo! 🇯🇵", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "read", type: "text" },
    { id: "m13", chatId: "6", senderId: "1", content: "No way! Send pics!", timestamp: new Date(Date.now() - 7100000).toISOString(), status: "delivered", type: "text" },
  ],
};

export const mockChats: Chat[] = [
  { id: "2", type: "private", participants: ["1", "2"], lastMessage: mockMessages["2"]?.[4], unreadCount: 1, pinned: true },
  { id: "3", type: "private", participants: ["1", "3"], lastMessage: mockMessages["3"]?.[1], unreadCount: 0, pinned: false },
  { id: "4", type: "private", participants: ["1", "4"], lastMessage: mockMessages["4"]?.[2], unreadCount: 0, pinned: true },
  { id: "5", type: "private", participants: ["1", "5"], lastMessage: mockMessages["5"]?.[0], unreadCount: 0, pinned: false },
  { id: "6", type: "private", participants: ["1", "6"], lastMessage: mockMessages["6"]?.[1], unreadCount: 2, pinned: false },
];

export const mockStatuses: Status[] = [
  { id: "s1", userId: "2", content: "Working on something exciting! 🚀", type: "text", timestamp: new Date(Date.now() - 3600000).toISOString(), viewers: ["1", "4"] },
  { id: "s2", userId: "4", content: "Coffee break ☕", type: "text", timestamp: new Date(Date.now() - 7200000).toISOString(), viewers: ["1"] },
  { id: "s3", userId: "6", content: "Tokyo vibes 🌸", type: "text", timestamp: new Date(Date.now() - 1800000).toISOString(), viewers: [] },
];
