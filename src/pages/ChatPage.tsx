import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquarePlus, Settings, LogOut, CircleDot, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { StatusPanel } from "@/components/chat/StatusPanel";
import { ProfilePanel } from "@/components/chat/ProfilePanel";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { useNavigate } from "react-router-dom";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type Tab = "chats" | "status" | "directory" | "profile";

const ChatPage = () => {
  const { chats, activeChat, setActiveChat, createGroup, startPrivateChat, profiles } = useChat();
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  
  // Group creation state
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [foundUsers, setFoundUsers] = useState<User[]>([]);

  useEffect(() => {
    if (activeTab === "directory") {
       fetchDirectory();
    }
  }, [activeTab]);

  const fetchDirectory = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUser?.id)
      .order("name");
    if (data) setDirectoryUsers(data as User[]);
  };

  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`name.ilike.%${userSearchTerm}%,phone.ilike.%${userSearchTerm}%`)
      .limit(10);
    
    if (data) setFoundUsers(data as User[]);
  };

  const onMessageUser = async (userId: string) => {
     try {
       const chatId = await startPrivateChat(userId);
       setActiveChat(chatId);
       setActiveTab("chats");
     } catch (err) {
       console.error(err);
     }
  };

  const filteredChats = chats.filter(chat => {
    if (!search) return true;
    if (chat.type === "group") return chat.name?.toLowerCase().includes(search.toLowerCase());
    const otherId = chat.participants.find(p => p !== currentUser?.id) || "";
    const contact = profiles[otherId];
    return (contact?.name || "Initializing...").toLowerCase().includes(search.toLowerCase());
  });


  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at || 0).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at || 0).getTime() : 0;
    return bTime - aTime;
  });


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return;
    await createGroup(groupName, selectedUsers);
    setGroupName("");
    setSelectedUsers([]);
    setIsGroupOpen(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const renderSidebar = () => (
    <div className={`flex flex-col h-full bg-card ${activeChat ? "hidden md:flex" : "flex"} md:w-[400px] md:border-r-3 md:border-foreground`}>
      {/* Header */}
      <div className="p-4 border-b-3 border-foreground">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="w-9 h-9 bg-primary border-3 border-foreground rounded-xl flex items-center justify-center brutal-shadow-sm">
              <span className="text-primary-foreground text-lg font-black">E</span>
            </span>
            EchoConnect
          </h1>
          <div className="flex gap-1">
            <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserPlus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-foreground brutal-shadow p-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">New Collective</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Group Identity</label>
                    <input 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. The Alpha Squad"
                      className="brutal-input w-full h-12 text-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Search by Email or Name</label>
                    <div className="flex gap-2">
                       <input 
                         value={userSearchTerm}
                         onChange={(e) => setUserSearchTerm(e.target.value)}
                         placeholder="user@example.com"
                         className="brutal-input flex-1 h-11"
                       />
                       <Button onClick={handleUserSearch} size="icon" className="h-11 w-11 shrink-0"><Search className="w-4 h-4" /></Button>
                    </div>
                    
                    <div className="max-h-[180px] overflow-y-auto border-3 border-foreground rounded-xl p-2 space-y-1 bg-muted/20 mt-2">
                      {foundUsers.length === 0 ? (
                        <p className="p-4 text-center text-xs font-bold text-muted-foreground">Search for collaborators</p>
                      ) : foundUsers.map(u => (
                        <div 
                          key={u.id} 
                          onClick={() => toggleUser(u.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border-2 ${
                            selectedUsers.includes(u.id) ? "bg-primary/20 border-primary" : "border-transparent hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar user={u} size="sm" />
                            <div className="flex flex-col">
                               <span className="font-bold text-sm">{u.name}</span>
                               <span className="text-[10px] opacity-60 lowercase">{u.phone}</span>
                            </div>
                          </div>
                          <Checkbox checked={selectedUsers.includes(u.id)} className="border-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>


                  <Button 
                    onClick={handleCreateGroup} 
                    className="w-full h-14 text-xl font-black brutal-shadow-sm border-3 border-foreground"
                    disabled={!groupName || selectedUsers.length === 0}
                  >
                    DEPLOY GROUP
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>


        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {([
            { key: "chats" as Tab, icon: MessageSquarePlus, label: "Chats" },
            { key: "directory" as Tab, icon: UserPlus, label: "Explore" },
            { key: "status" as Tab, icon: CircleDot, label: "Status" },
            { key: "profile" as Tab, icon: Settings, label: "Me" },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border-2 border-foreground font-bold text-[10px] transition-all uppercase tracking-tighter ${
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
          sortedChats.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-bold text-muted-foreground">No active missions yet.</p>
              <Button variant="outline" size="sm" className="mt-4 border-2 border-foreground font-black" onClick={() => setActiveTab("directory")}>Explore Directory</Button>
            </div>
          ) : (
            sortedChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat === chat.id}
                onClick={() => setActiveChat(chat.id)}
              />
            ))
          )
        )}
        {activeTab === "directory" && (
          <div className="p-4 space-y-3">
             <h3 className="text-xs font-black uppercase tracking-widest opacity-60 px-2 py-2">Global Comms Directory</h3>
             {directoryUsers.length === 0 ? (
               <p className="p-4 text-center text-sm font-bold opacity-40">Zero signals detected... invite someone!</p>
             ) : (
               directoryUsers.map(u => (
                 <div key={u.id} className="p-3 bg-card border-3 border-foreground rounded-xl flex items-center justify-between brutal-shadow-sm group hover:-translate-y-0.5 transition-transform">
                   <div className="flex items-center gap-3">
                     <UserAvatar user={u} size="md" />
                     <div className="flex flex-col">
                        <span className="font-black text-sm">{u.name}</span>
                        <span className="text-[10px] opacity-60 lowercase truncate max-w-[150px]">{u.phone}</span>
                     </div>
                   </div>
                   <Button size="sm" className="h-8 px-3 font-black text-[10px] border-2 border-foreground" onClick={() => onMessageUser(u.id)}>MESSAGE</Button>
                 </div>
               ))
             )}
          </div>
        )}
        {activeTab === "status" && <StatusPanel />}
        {activeTab === "profile" && <ProfilePanel />}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">
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

      <CallOverlay />
    </div>
  );
};

export default ChatPage;
