import { User, Message, Chat, Status } from "@/types/chat";

export const mockUsers: User[] = [
  { id: "1", name: "You", avatar: "", bio: "Hey there! I'm using BrutalChat", online: true, last_seen: new Date().toISOString(), phone: "1234567890" },
  { id: "2", name: "Sarah Chen", avatar: "", bio: "Designer & maker", online: true, last_seen: new Date().toISOString(), phone: "1112223334" },
  { id: "3", name: "Marcus Johnson", avatar: "", bio: "Building cool stuff", online: false, last_seen: new Date(Date.now() - 3600000).toISOString(), phone: "2223334445" },
  { id: "4", name: "Aisha Patel", avatar: "", bio: "Coffee & code", online: true, last_seen: new Date().toISOString(), phone: "3334445556" },
  { id: "5", name: "Tom Wilson", avatar: "", bio: "🎵 Music is life", online: false, last_seen: new Date(Date.now() - 7200000).toISOString(), phone: "4445556667" },
  { id: "6", name: "Luna Rodriguez", avatar: "", bio: "Exploring the world", online: true, last_seen: new Date().toISOString(), phone: "5556667778" },
];

export const mockMessages: Record<string, Message[]> = {
  "2": [
    { id: "m1", chat_id: "2", sender_id: "2", content: "Hey! Did you see the new design system?", created_at: new Date(Date.now() - 600000).toISOString(), type: "text" },
    { id: "m2", chat_id: "2", sender_id: "1", content: "Yes! The neurobrutalist style is 🔥", created_at: new Date(Date.now() - 540000).toISOString(), type: "text" },
    { id: "m3", chat_id: "2", sender_id: "2", content: "Right?! Bold borders, hard shadows, chunky buttons. Love it.", created_at: new Date(Date.now() - 480000).toISOString(), type: "text" },
    { id: "m4", chat_id: "2", sender_id: "1", content: "It's like brutalism met a candy shop 😂", created_at: new Date(Date.now() - 420000).toISOString(), type: "text" },
    { id: "m5", chat_id: "2", sender_id: "2", content: "Haha perfect description! Want to collab on the chat app?", created_at: new Date(Date.now() - 60000).toISOString(), type: "text" },
  ],
  "3": [
    { id: "m6", chat_id: "3", sender_id: "3", content: "The API is ready for testing", created_at: new Date(Date.now() - 1800000).toISOString(), type: "text" },
    { id: "m7", chat_id: "3", sender_id: "1", content: "Awesome, I'll check it out today", created_at: new Date(Date.now() - 1700000).toISOString(), type: "text" },
  ],
  "4": [
    { id: "m8", chat_id: "4", sender_id: "4", content: "Meeting at 3pm?", created_at: new Date(Date.now() - 3600000).toISOString(), type: "text" },
    { id: "m9", chat_id: "4", sender_id: "1", content: "Works for me! ☕", created_at: new Date(Date.now() - 3500000).toISOString(), type: "text" },
    { id: "m10", chat_id: "4", sender_id: "4", content: "Great, see you then!", created_at: new Date(Date.now() - 3400000).toISOString(), type: "text" },
  ],
  "5": [
    { id: "m11", chat_id: "5", sender_id: "5", content: "Check out this playlist 🎵", created_at: new Date(Date.now() - 86400000).toISOString(), type: "text" },
  ],
  "6": [
    { id: "m12", chat_id: "6", sender_id: "6", content: "Just landed in Tokyo! 🇯🇵", created_at: new Date(Date.now() - 7200000).toISOString(), type: "text" },
    { id: "m13", chat_id: "6", sender_id: "1", content: "No way! Send pics!", created_at: new Date(Date.now() - 7100000).toISOString(), type: "text" },
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
  { id: "s1", user_id: "2", content: "Working on something exciting! 🚀", type: "text", created_at: new Date(Date.now() - 3600000).toISOString(), viewers: ["1", "4"] },
  { id: "s2", user_id: "4", content: "Coffee break ☕", type: "text", created_at: new Date(Date.now() - 7200000).toISOString(), viewers: ["1"] },
  { id: "s3", user_id: "6", content: "Tokyo vibes 🌸", type: "text", created_at: new Date(Date.now() - 1800000).toISOString(), viewers: [] },
];
