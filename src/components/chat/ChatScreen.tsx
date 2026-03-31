import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, Send, Smile, Paperclip, Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { UserAvatar, getUser } from "@/components/chat/UserAvatar";
import { Message } from "@/types/chat";

const EMOJI_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const MessageBubble = ({ message, onReact }: { message: Message; onReact: (emoji: string) => void }) => {
  const isMine = message.senderId === "1";
  const [showReactions, setShowReactions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}
    >
      <div className="relative max-w-[80%]">
        <div
          onDoubleClick={() => setShowReactions(!showReactions)}
          className={`px-4 py-2.5 rounded-xl border-3 border-foreground text-[15px] cursor-pointer ${
            isMine
              ? "bg-chat-outgoing text-chat-outgoing-foreground brutal-shadow-sm rounded-br-sm"
              : "bg-chat-incoming text-chat-incoming-foreground brutal-shadow-sm rounded-bl-sm"
          }`}
        >
          <p className="break-words">{message.content}</p>
          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="text-[11px] opacity-70 font-mono">
              {format(new Date(message.timestamp), "HH:mm")}
            </span>
            {isMine && (
              message.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 opacity-90" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-70" />
              )
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {message.reactions.map((r, i) => (
              <span key={i} className="text-sm bg-card border-2 border-foreground rounded-full px-1.5 py-0.5">
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 bg-card border-3 border-foreground rounded-xl p-2 flex gap-1 brutal-shadow-sm z-10`}
            >
              {EMOJI_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); setShowReactions(false); }}
                  className="text-lg hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const ChatScreen = ({ chatId, onBack }: { chatId: string; onBack: () => void }) => {
  const { messages, sendMessage, addReaction } = useChat();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUser = getUser(chatId);
  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(chatId, input.trim());
    setInput("");

    // Simulate typing and reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b-3 border-foreground">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <UserAvatar user={otherUser} showOnline />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{otherUser.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {otherUser.online ? "Online" : "Last seen recently"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chatMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onReact={(emoji) => addReaction(msg.id, chatId, emoji)}
          />
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-3"
          >
            <div className="bg-chat-incoming text-chat-incoming-foreground px-4 py-3 rounded-xl border-3 border-foreground brutal-shadow-sm rounded-bl-sm">
              <div className="flex gap-1.5">
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t-3 border-foreground">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="brutal-input flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
