import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { Pin, Check, CheckCheck } from "lucide-react";
import { Chat } from "@/types/chat";
import { UserAvatar, getUser } from "@/components/chat/UserAvatar";

export const ChatListItem = ({ chat, onClick, isActive }: {
  chat: Chat;
  onClick: () => void;
  isActive: boolean;
}) => {
  const otherUser = getUser(chat.participants.find(p => p !== "1") || "2");
  const lastMsg = chat.lastMessage;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd/MM/yy");
  };

  const statusIcon = lastMsg?.senderId === "1" ? (
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
        isActive ? "bg-primary/10" : "hover:bg-muted"
      }`}
    >
      <UserAvatar user={otherUser} showOnline />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base truncate">{otherUser.name}</span>
            {chat.pinned && <Pin className="w-3.5 h-3.5 text-muted-foreground rotate-45" />}
          </div>
          {lastMsg && (
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {formatTime(lastMsg.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {statusIcon}
          <span className="text-sm text-muted-foreground truncate">
            {lastMsg?.content || "No messages yet"}
          </span>
          {chat.unreadCount > 0 && (
            <span className="ml-auto shrink-0 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-foreground">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};
