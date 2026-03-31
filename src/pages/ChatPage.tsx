import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquarePlus, Settings, LogOut, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { StatusPanel } from "@/components/chat/StatusPanel";
import { ProfilePanel } from "@/components/chat/ProfilePanel";
import { useNavigate } from "react-router-dom";

type Tab = "chats" | "status" | "profile";

const ChatPage = () => {
  const { chats, activeChat, setActiveChat } = useChat();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chats");

  const filteredChats = chats.filter(chat => {
    if (!search) return true;
    const userId = chat.participants.find(p => p !== "1") || "";
    const user = getUser(userId);
    return user?.name.toLowerCase().includes(search.toLowerCase());
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderSidebar = () => (
    <div className={`flex flex-col h-full bg-card ${activeChat ? "hidden md:flex" : "flex"} md:w-[400px] md:border-r-3 md:border-foreground`}>
      {/* Header */}
      <div className="p-4 border-b-3 border-foreground">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-primary border-3 border-foreground rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">B</span>
            </span>
            BrutalChat
          </h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {([
            { key: "chats" as Tab, icon: MessageSquarePlus, label: "Chats" },
            { key: "status" as Tab, icon: CircleDot, label: "Status" },
            { key: "profile" as Tab, icon: Settings, label: "Profile" },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-3 border-foreground font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground brutal-shadow-sm"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "chats" && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="brutal-input w-full pl-11 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" && (
          sortedChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChat === chat.id}
              onClick={() => setActiveChat(chat.id)}
            />
          ))
        )}
        {activeTab === "status" && <StatusPanel />}
        {activeTab === "profile" && <ProfilePanel />}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex">
      {renderSidebar()}

      {/* Chat area */}
      <div className={`flex-1 ${!activeChat ? "hidden md:flex" : "flex"} flex-col`}>
        {activeChat ? (
          <ChatScreen chatId={activeChat} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-muted border-3 border-foreground rounded-2xl flex items-center justify-center brutal-shadow">
                <MessageSquarePlus className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Pick a chat</h2>
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
