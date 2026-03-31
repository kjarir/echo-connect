import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Shield, Bell, Palette, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { Button } from "@/components/ui/button";

export const ProfilePanel = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [darkMode, setDarkMode] = useState(false);

  if (!user) return null;

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const settings = [
    { icon: Shield, label: "Privacy", desc: "Last seen, profile photo, about" },
    { icon: Bell, label: "Notifications", desc: "Message, group & call tones" },
    { icon: Info, label: "About", desc: "BrutalChat v1.0" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-4">
          <UserAvatar user={user} size="lg" />
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary border-3 border-foreground rounded-lg flex items-center justify-center brutal-shadow-sm">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        <div className="w-full space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="brutal-input w-full text-center font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Bio</label>
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="brutal-input w-full text-center"
            />
          </div>
        </div>
      </motion.div>

      {/* Theme toggle */}
      <button
        onClick={toggleDark}
        className="w-full flex items-center gap-3 p-3 rounded-xl border-3 border-foreground bg-card brutal-shadow-sm"
      >
        <div className="w-10 h-10 bg-secondary border-3 border-foreground rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold">Theme</p>
          <p className="text-sm text-muted-foreground">{darkMode ? "Dark mode" : "Light mode"}</p>
        </div>
        <div className={`w-12 h-7 rounded-full border-3 border-foreground transition-colors p-0.5 ${darkMode ? "bg-primary" : "bg-muted"}`}>
          <motion.div
            animate={{ x: darkMode ? 18 : 0 }}
            className="w-5 h-5 bg-card border-2 border-foreground rounded-full"
          />
        </div>
      </button>

      {/* Settings list */}
      <div className="space-y-2">
        {settings.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-3 border-foreground bg-card brutal-shadow-sm hover:brutal-shadow transition-all"
          >
            <div className="w-10 h-10 bg-accent border-3 border-foreground rounded-lg flex items-center justify-center">
              <s.icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold">{s.label}</p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <Button variant="destructive" className="w-full">
        Delete Account
      </Button>
    </div>
  );
};
