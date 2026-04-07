import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import CryptoJS from "crypto-js";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable UUID generator for Dev Bypass
  const generateUUID = (str: string): string => {
    // Generate a stable MD5 hash (32 hex characters)
    const hash = CryptoJS.MD5(str.toLowerCase().trim()).toString();
    // Format as UUID: 8-4-4-4-12
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  };


  const fetchProfile = async (id: string, email: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        return data as User;
      } else {
        const newProfile = {
          id,
          name: email ? email.split("@")[0] : "Dev User",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          bio: "Connected via Dev Bypass.",
          online: true,
          last_seen: new Date().toISOString(), // Match database snake_case
          phone: email
        };
        
        const { error: insertError } = await supabase.from("profiles").insert(newProfile);
        if (insertError) {
          console.error("DB Insert Error:", insertError.message);
          // If insert fails (maybe already exists but fetch failed?), fallback to mock or toast
        }
        return newProfile as User;
      }
    } catch (err) {
      console.error("Profile Exception:", err);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("bchat_dev_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        // FORCE LOGOUT if the ID is the old Base64 format (no hyphens)
        if (!parsed.id || !parsed.id.includes("-")) {
           localStorage.removeItem("bchat_dev_user");
           setUser(null);
        } else {
           setUser(parsed);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          setUser(profile);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);


  const signInWithEmail = useCallback(async (email: string) => {
    const bypassId = generateUUID(email);
    const profile = await fetchProfile(bypassId, email);
    if (!profile) {
       toast.error("Failed to establish session directory.");
       return;
    }
    setUser(profile);
    localStorage.setItem("bchat_dev_user", JSON.stringify(profile));
    toast.success("Identity established: " + email);
  }, []);

  const verifyOTP = useCallback(async (email: string, token: string) => {
    toast.success("Bypassing verification...");
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
    localStorage.setItem("bchat_dev_user", JSON.stringify({ ...user, ...updates }));
    
    // Attempt DB sync
    await supabase.from("profiles").update(updates).eq("id", user.id);
  }, [user]);

  const logout = useCallback(async () => {
    localStorage.removeItem("bchat_dev_user");
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signInWithEmail, verifyOTP, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
