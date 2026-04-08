export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
  last_seen: string;
  phone: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: "text" | "image" | "video" | "audio" | "document" | "file";
  status?: "sent" | "delivered" | "read";
  reply_to?: string;
  reactions?: { emoji: string; user_id: string }[];
  is_encrypted?: boolean;
  metadata?: any;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  participants: string[];
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount?: number;
  pinned: boolean;
  is_group?: boolean;
}

export interface Status {
  id: string;
  user_id: string;
  content: string;
  type: "text" | "image" | "video";
  created_at: string;
  viewers: string[];
}
