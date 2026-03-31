import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { Pin, Check, CheckCheck, Users } from "lucide-react";
import { Chat } from "@/types/chat";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

export const ChatListItem = ({ chat, onClick, isActive }: {
  chat: Chat;
  onClick: () => void;
  isActive: boolean;
}) => {
  const { user } = useAuth();
  const { profiles } = useChat();
  const isGroup = chat.type === "group";
  
  // For private chats, find the other participant
  const otherParticipantId = (chat.participants || []).find(p => p !== user?.id) || "";
  const otherUser = profiles[otherParticipantId];
  
  const displayName = isGroup ? (chat.name || "Group Chat") : (otherUser?.name || "Initializing...");


  const lastMsg = chat.lastMessage;

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd/MM/yy");
  };

  const statusIcon = lastMsg?.sender_id === user?.id ? (
    lastMsg.status === "read" ? (
      <CheckCheck className="w-4 h-4 text-primary shrink-0" />
    ) : (
      <Check className="w-4 h-4 text-muted-foreground shrink-0" />
    )
  ) : null;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b-3 border-foreground ${
        isActive ? "bg-primary/20" : "hover:bg-muted"
      }`}
    >
      {isGroup ? (
         <div className="w-12 h-12 bg-accent border-3 border-foreground rounded-xl flex items-center justify-center brutal-shadow-sm shrink-0">
            <Users className="w-6 h-6 text-accent-foreground" />
         </div>
      ) : (
         <UserAvatar user={otherUser} showOnline />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base truncate">{displayName}</span>
            {chat.pinned && <Pin className="w-3.5 h-3.5 text-muted-foreground rotate-45" />}
          </div>
          {lastMsg && (
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {formatTime(lastMsg.created_at)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          {statusIcon}
          <span className="text-sm text-muted-foreground truncate font-bold">
            {lastMsg?.content || (isGroup ? "Collective started" : "New connection")}
          </span>
          {(chat.unreadCount ?? 0) > 0 && (
            <span className="ml-auto shrink-0 bg-primary text-primary-foreground text-xs font-black min-w-[24px] h-6 rounded-lg px-1 flex items-center justify-center border-2 border-foreground brutal-shadow-sm">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

