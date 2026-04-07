import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Shield, Bell, Info, Trash2, Save, ArrowLeft, ChevronRight, Lock, Eye, CheckCircle, Smartphone, Globe, Github } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type SettingsView = "main" | "privacy" | "notifications" | "about";

export const ProfilePanel = () => {
  const { user, updateProfile, logout } = useAuth();
  const { uploadMedia } = useChat();
  const [view, setView] = useState<SettingsView>("main");
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile({ name, bio });
      toast.success("Profile synchronized!");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading avatar...");
    const url = await uploadMedia(file);
    if (url) {
      await updateProfile({ avatar: url });
      toast.success("Avatar updated!", { id: toastId });
    }
  };

  const SubPageHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 mb-6">
       <button onClick={() => setView("main")} className="p-2 rounded-xl border-3 border-foreground bg-card hover:bg-muted brutal-shadow-xs transition-all">
          <ArrowLeft className="w-5 h-5" />
       </button>
       <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="p-4 h-full overflow-y-auto custom-scrollbar bg-background">
      <AnimatePresence mode="wait">
        {view === "main" && (
          <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <UserAvatar user={user} size="lg" />
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary border-3 border-foreground rounded-xl flex items-center justify-center brutal-shadow-sm hover:scale-110 transition-transform z-10">
                  <Camera className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
              
              <div className="w-full space-y-4">
                <div className="space-y-1.5 px-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-left">Identity Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="brutal-input w-full font-black text-lg" placeholder="Entity name..." />
                </div>
                <div className="space-y-1.5 px-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-left">Broadcast Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="brutal-input w-full font-bold text-sm resize-none" placeholder="Transmission metadata..." />
                </div>
                <Button onClick={handleUpdate} disabled={loading} className="w-full h-12 text-md font-black gap-2 mt-2">
                  <Save className="w-5 h-5" />
                  {loading ? "Syncing..." : "Commit Changes"}
                </Button>
              </div>
            </div>

            <div className="h-px bg-foreground/10 my-6" />

            {/* Navigation Menus */}
            <div className="space-y-3">
              <button onClick={() => setView("privacy")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-sm hover:translate-x-1 hover:translate-y-[-2px] transition-all">
                <div className="p-2 bg-primary/20 border-2 border-foreground rounded-lg"><Shield className="w-5 h-5" /></div>
                <div className="flex-1 text-left"><p className="font-black text-sm uppercase tracking-tight">Privacy Signal</p><p className="text-[10px] font-bold text-muted-foreground">Shadows & Visibility</p></div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </button>
              <button onClick={() => setView("notifications")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-sm hover:translate-x-1 hover:translate-y-[-2px] transition-all">
                <div className="p-2 bg-accent/20 border-2 border-foreground rounded-lg"><Bell className="w-5 h-5" /></div>
                <div className="flex-1 text-left"><p className="font-black text-sm uppercase tracking-tight">Alert Core</p><p className="text-[10px] font-bold text-muted-foreground">Tones & Vibrations</p></div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </button>
              <button onClick={() => setView("about")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-sm hover:translate-x-1 hover:translate-y-[-2px] transition-all">
                <div className="p-2 bg-secondary/20 border-2 border-foreground rounded-lg"><Info className="w-5 h-5" /></div>
                <div className="flex-1 text-left"><p className="font-black text-sm uppercase tracking-tight">BChat Node Stats</p><p className="text-[10px] font-bold text-muted-foreground">Version 2.0-Alpha</p></div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </button>
            </div>

            <div className="pt-8 space-y-4">
              <Button variant="destructive" className="w-full h-12 border-3 border-foreground brutal-shadow-sm font-black gap-2 uppercase tracking-widest text-xs" onClick={() => logout()}>Disconnect Session</Button>
              <button onClick={() => toast.error("Account erasure requires root privileges.")} className="w-full text-destructive/60 font-black text-[10px] uppercase tracking-[0.2em] py-2 hover:underline flex items-center justify-center gap-2">
                <Trash2 className="w-3 h-3" /> Terminate Account
              </button>
            </div>
          </motion.div>
        )}

        {view === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <SubPageHeader title="Privacy Signal" />
            <div className="space-y-4">
               {[
                 { icon: Eye, label: "Last Seen & Online", val: "Everyone" },
                 { icon: UserAvatar, label: "Profile Photo", val: "Everyone" },
                 { icon: Lock, label: "Read Receipts", toggle: true },
                 { icon: CheckCircle, label: "Connected Contacts", val: "Automatic" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-xs">
                    <div className="p-2 bg-muted border-2 border-foreground rounded-lg">
                       {typeof item.icon === "string" ? null : <item.icon className="w-4 h-4" user={user} size="sm" />}
                    </div>
                    <div className="flex-1">
                       <p className="font-black text-xs uppercase tracking-tight leading-none mb-1">{item.label}</p>
                       <p className="text-[10px] font-bold text-muted-foreground">{item.val || "Real-time sync active"}</p>
                    </div>
                    {item.toggle && <Switch checked={true} className="data-[state=checked]:bg-primary border-2 border-foreground" />}
                 </div>
               ))}
               <div className="p-4 bg-primary/5 border-2 border-dashed border-primary rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-loose">Privacy settings are enforced by end-to-end signal encryption.</p>
               </div>
            </div>
          </motion.div>
        )}

        {view === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <SubPageHeader title="Alert Core" />
            <div className="space-y-4">
               <div className="p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                     <div><p className="font-black text-xs uppercase">Message Tones</p><p className="text-[10px] text-muted-foreground font-bold">Ping Frequency</p></div>
                     <Switch checked={true} className="data-[state=checked]:bg-primary border-2 border-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                     <div><p className="font-black text-xs uppercase">Call Ringtone</p><p className="text-[10px] text-muted-foreground font-bold">High Pitch Signal</p></div>
                     <Switch checked={true} className="data-[state=checked]:bg-primary border-2 border-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                     <div><p className="font-black text-xs uppercase">Haptic Feedback</p><p className="text-[10px] text-muted-foreground font-bold">Tactile Alerts</p></div>
                     <Switch checked={true} className="data-[state=checked]:bg-primary border-2 border-foreground" />
                  </div>
               </div>
               <div className="p-4 rounded-2xl border-3 border-destructive/20 bg-destructive/5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive">Mute modes can be overridden by urgent SOS signals.</p>
               </div>
            </div>
          </motion.div>
        )}

        {view === "about" && (
          <motion.div key="about" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex flex-col items-center">
            <div className="w-full"><SubPageHeader title="Node Stats" /></div>
            
            <div className="relative group">
               <div className="w-24 h-24 bg-primary border-4 border-foreground rounded-3xl brutal-shadow flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="text-4xl font-black text-primary-foreground">B</span>
               </div>
            </div>

            <div className="text-center space-y-2">
               <h1 className="text-3xl font-black tracking-tighter uppercase">BChat</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-50">Industrial Grade Signal Hub</p>
            </div>

            <div className="w-full space-y-3">
               {[
                 { icon: Smartphone, label: "Host Platform", val: "Web 3.0 Node" },
                 { icon: Globe, label: "Network status", val: "Encrypted WebSocket" },
                 { icon: Github, label: "Open Source", val: "v2.0-Production" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-muted/20">
                    <item.icon className="w-5 h-5 opacity-40" />
                    <div className="text-left"><p className="text-[10px] font-black uppercase text-muted-foreground">{item.label}</p><p className="font-bold text-sm">{item.val}</p></div>
                 </div>
               ))}
            </div>

            <p className="text-[10px] text-center font-bold text-muted-foreground px-6">Built with uncompromising aesthetics and brutal efficiency for the next generation of communication.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
