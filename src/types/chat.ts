export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "video" | "audio" | "document";
  replyTo?: string;
  reactions?: { emoji: string; userId: string }[];
}

export interface Chat {
  id: string;
  type: "private" | "group";
  participants: string[];
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  pinned: boolean;
}

export interface Status {
  id: string;
  userId: string;
  content: string;
  type: "text" | "image" | "video";
  timestamp: string;
  viewers: string[];
}
