import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type AuthActionResult = {
  authenticated: boolean;
  requiresEmailVerification?: boolean;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
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

  const buildProfile = useCallback((id: string, email: string, name?: string): User => ({
    id,
    name: name || email.split("@")[0] || "New user",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: "Joined BChat.",
    online: true,
    last_seen: new Date().toISOString(),
    phone: "",
  }), []);

  const getAuthErrorMessage = useCallback((error: unknown) => {
    if (!error || typeof error !== "object" || !("message" in error)) {
      return "Authentication failed. Please try again.";
    }

    const message = String(error.message || "");
    const normalized = message.toLowerCase();

    if (normalized.includes("invalid login credentials")) {
      return "Incorrect email or password.";
    }

    if (normalized.includes("email not confirmed")) {
      return "Please verify your email before logging in.";
    }

    if (normalized.includes("user already registered")) {
      return "This email is already registered. Try logging in instead.";
    }

    return message || "Authentication failed. Please try again.";
  }, []);

  const getOrCreateProfile = useCallback(async (id: string, email: string, name?: string) => {
    const fallbackProfile = buildProfile(id, email, name);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profile) {
      return { ...fallbackProfile, ...(profile as Partial<User>) } as User;
    }

    if (profileError) {
      console.warn("BChat: profile lookup failed, using auth user fallback.", profileError.message);
    }

    const { error: insertError } = await supabase.from("profiles").insert(fallbackProfile);

    if (insertError) {
      console.warn("BChat: profile creation failed, continuing with fallback user.", insertError.message);
    }

    return fallbackProfile;
  }, [buildProfile]);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const profile = await getOrCreateProfile(
      session.user.id,
      session.user.email || "",
      session.user.user_metadata?.name
    );

    setUser(profile);
    setIsLoading(false);
  }, [getOrCreateProfile]);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null) => {
      if (!isMounted) return;
      await applySession(session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = async (email: string, password: string, name: string): Promise<AuthActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Unable to create account.");

      if (data.session?.user) {
        const profile = await getOrCreateProfile(data.session.user.id, data.session.user.email || email, name);
        setUser(profile);
        toast.success("Account created successfully!");
        return { authenticated: true };
      }

      toast.success("Account created. Check your email to verify it before logging in.");
      return { authenticated: false, requiresEmailVerification: true };
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Unable to sign in.");

      const profile = await getOrCreateProfile(
        data.user.id,
        data.user.email || email,
        data.user.user_metadata?.name
      );

      setUser(profile);
      toast.success("Welcome back!");
      return { authenticated: true };
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    const nextUser = { ...user, ...updates };
    const { error } = await supabase.from("profiles").upsert(nextUser);

    if (error) {
      toast.error("Failed to update profile in Supabase.");
      return;
    }

    setUser(nextUser);
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
