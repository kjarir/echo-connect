import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, Send, Smile, Paperclip, Phone, Video, MoreVertical, Check, Users, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { Message } from "@/types/chat";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJI_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥", "💯", "🙏", "✨"];
const QUICK_EMOJIS = ["😊", "😂", "🥰", "😎", "🤔", "😅", "🔥", "👍", "🎉", "❤️", "🙌", "😲"];

const MessageBubble = ({ message, onReact }: { message: Message; onReact: (emoji: string) => void }) => {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;
  const [showReactions, setShowReactions] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Deep Signal Filtering: System messages & Call logs
  const isSignal = message.content.startsWith("__SIGNAL__:") || 
                  message.content.toLowerCase().includes("call ended") || 
                  message.content.toLowerCase().includes("missed") ||
                  message.content.toLowerCase().includes("call accepted");

  if (isSignal) {
    let display = message.content.replace("__SIGNAL__:", "");
    if (display === "initiate:voice") display = "Voice call initiated";
    if (display === "initiate:video") display = "Video call initiated";
    if (display === "accept") display = "Call accepted";
    if (display === "reject") display = "Call rejected";
    if (display === "end") display = "Call ended";

    return (
      <div className="flex justify-center my-4 py-1">
        <div className="px-4 py-1.5 bg-muted/20 border-2 border-foreground/10 rounded-full backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
           <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-pulse" />
              {display} • {format(new Date(message.created_at || Date.now()), "HH:mm")}
           </p>
        </div>
      </div>
    );
  }

  // Robust Media Detection signatures
  const isImageSignal = !loadError && (message.type === "image" || (typeof message.content === "string" && (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(message.content) || message.content.includes("/public/media/"))));
  const isVideoSignal = !loadError && (message.type === "video" || (typeof message.content === "string" && (/\.(mp4|webm|ogg)/i.test(message.content) || message.content.includes(".mp4"))));
  const isPdf = typeof message.content === "string" && message.content.toLowerCase().includes(".pdf");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}
    >
      <div className="relative max-w-[85%]">
        <div
          onDoubleClick={() => setShowReactions(!showReactions)}
          className={`px-4 py-2.5 rounded-2xl border-3 border-foreground text-[15px] cursor-pointer shadow-sm transition-all ${
            isMine
              ? "bg-chat-outgoing text-chat-outgoing-foreground brutal-shadow-xs rounded-br-none"
              : "bg-chat-incoming text-chat-incoming-foreground brutal-shadow-xs rounded-bl-none"
          }`}
        >
          {isImageSignal && !loadError ? (
             <div className="p-0.5 min-w-[120px]">
               <img 
                 src={message.content} 
                 alt="Visual Signal" 
                 onError={() => setLoadError(true)} 
                 className="rounded-xl border-2 border-foreground max-h-72 w-full object-cover brutal-shadow-xs animate-in fade-in" 
               />
             </div>
          ) : isVideoSignal && !loadError ? (
             <div className="p-0.5 min-w-[120px]">
               <video 
                 src={message.content} 
                 controls 
                 onError={() => setLoadError(true)}
                 className="rounded-xl border-2 border-foreground max-h-72 w-full object-cover brutal-shadow-xs" 
               />
             </div>
          ) : message.type === "audio" || (typeof message.content === "string" && (message.content.includes(".mp3") || message.content.includes(".wav"))) ? (
             <div className="flex flex-col gap-2 p-1 min-w-[220px]">
                <div className="flex items-center gap-2">
                   <Mic className={`w-4 h-4 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
                   <span className="font-black text-[10px] uppercase tracking-widest leading-none">Acoustic Logic</span>
                </div>
                <audio src={message.content} controls className="h-9 w-full filter brightness-110 contrast-125" />
             </div>
          ) : (message.type === "file" || loadError || isPdf) ? (
             <a href={message.content} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-2 bg-foreground/10 border-2 border-foreground rounded-xl hover:translate-y-[-2px] hover:bg-foreground/20 transition-all">
                <div className="p-2.5 bg-foreground/10 rounded-lg border border-foreground/30 shadow-inner">
                   <Paperclip className="w-5 h-5 opacity-70" />
                </div>
                <div className="flex flex-col text-left">
                   <p className="font-black text-xs uppercase tracking-tight leading-none mb-1">
                      {isPdf ? "PDF DOCUMENT" : "PAYLOAD RECOVERY"}
                   </p>
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                      {isPdf ? "Verified Signal" : "Secure Recovery link"}
                   </p>
                </div>
             </a>
          ) : (
             <p className="break-words leading-relaxed font-semibold">{message.content}</p>
          )}

          <div className={`flex items-center gap-2 mt-2 ${isMine ? "justify-end opacity-60" : "justify-start opacity-40"}`}>
            <span className="text-[9px] font-black font-mono">
              {format(new Date(message.created_at || Date.now()), "HH:mm")}
            </span>
            {isMine && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Reaction Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-1 -mt-3 ${isMine ? "justify-end mr-1.5" : "justify-start ml-1.5"}`}>
            {message.reactions.map((r, i) => (
              <span key={i} className="text-sm bg-card border-2 border-foreground rounded-full px-2 py-0.5 brutal-shadow-xs scale-100 hover:scale-110 transition-transform">
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
              className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 bg-card border-3 border-foreground rounded-2xl p-2 flex gap-1 brutal-shadow-sm z-10`}
            >
              {EMOJI_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); setShowReactions(false); }}
                  className="text-lg hover:scale-150 transition-transform p-1.5"
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
  const { messages, chats, profiles, sendMessage, addReaction, initiateCall, uploadMedia, isRecording, startRecording, stopRecording } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentChat = chats.find(c => c.id === chatId);
  const isGroup = currentChat?.type === "group";
  const otherParticipantId = currentChat?.participants?.find(p => p !== user?.id) || "";
  const otherUser = profiles[otherParticipantId];
  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(chatId, input.trim());
    setInput("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Broadcasting media...");
    const url = await uploadMedia(file);
    if (url) {
       await sendMessage(chatId, url, file.type.startsWith("image/") ? "image" : "file");
       toast.success("Media deployed!", { id: toastId });
    } else {
       toast.error("Deployment failed", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b-3 border-foreground z-20">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {isGroup ? (
           <div className="w-12 h-12 bg-accent border-3 border-foreground rounded-2xl flex items-center justify-center shrink-0 brutal-shadow-xs text-foreground font-black">
             <Users className="w-6 h-6" />
           </div>
        ) : (
           <UserAvatar user={otherUser || { id: "0", name: "...", avatar: "", bio: "", online: false, last_seen: "", phone: "" }} showOnline />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg truncate tracking-tight">
             {isGroup ? (currentChat?.name || "Private Collective") : (otherUser?.name || "Initializing signal...")}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isGroup ? `${currentChat?.participants.length} connected` : (otherUser?.online ? "Signal Active" : "Signal Offline")}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => initiateCall(otherParticipantId, "voice")} className="hover:bg-primary/20"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => initiateCall(otherParticipantId, "video")} className="hover:bg-primary/20"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/10">
        {chatMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onReact={(emoji) => addReaction(msg.id, chatId, emoji)} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t-3 border-foreground z-20">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 brutal-shadow-xs border-2 border-foreground bg-background"><Smile className="w-5 h-5" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 border-4 border-foreground brutal-shadow rounded-2xl grid grid-cols-4 gap-2">
              {QUICK_EMOJIS.map(emoji => (
                <button 
                   key={emoji} 
                   onClick={() => setInput(prev => prev + emoji)}
                   className="text-2xl hover:scale-125 transition-transform p-1"
                >{emoji}</button>
              ))}
            </PopoverContent>
          </Popover>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 brutal-shadow-xs border-2 border-foreground bg-background"><Paperclip className="w-5 h-5" /></Button>
          
          {isRecording ? (
            <div className="flex-1 h-12 brutal-input bg-primary/10 flex items-center justify-between px-4 animate-pulse">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="font-black text-sm uppercase tracking-widest text-primary">Recording Signal...</span>
               </div>
               <Button variant="ghost" size="sm" onClick={() => stopRecording(chatId)} className="h-8 border-2 border-foreground bg-background font-bold text-[10px]"><Square className="w-3 h-3 mr-1 fill-foreground" /> STOP</Button>
            </div>
          ) : (
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Inject payload..."
              className="brutal-input flex-1 h-12"
            />
          )}

          {input.trim() || isRecording ? (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="shrink-0 h-12 w-12 brutal-shadow-sm border-2 border-foreground"><Send className="w-5 h-5" /></Button>
          ) : (
            <Button size="icon" onClick={startRecording} className="shrink-0 h-12 w-12 bg-primary brutal-shadow-sm border-2 border-foreground"><Mic className="w-5 h-5" /></Button>
          )}
        </div>
      </div>
    </div>
  );
};


