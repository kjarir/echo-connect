import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
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

  // Simple profile fetch/create helper
  const getOrCreateProfile = async (id: string, email: string, name?: string) => {
    // 1. Try to fetch
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profile) return profile as User;

    // 2. If missing, create it immediately
    const newProfile = {
      id,
      name: name || email.split("@")[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      bio: "Joined BChat.",
      online: true,
      last_seen: new Date().toISOString()
    };

    await supabase.from("profiles").insert(newProfile);
    return newProfile as User;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getOrCreateProfile(session.user.id, session.user.email || "");
        setUser(profile);
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await getOrCreateProfile(session.user.id, session.user.email || "");
        setUser(profile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name } }
      });
      if (error) throw error;
      
      if (data.user) {
        const profile = await getOrCreateProfile(data.user.id, email, name);
        setUser(profile);
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        const profile = await getOrCreateProfile(data.user.id, email);
        setUser(profile);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to update profile");
      return;
    }
    setUser({ ...user, ...updates });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signUp, signIn, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
