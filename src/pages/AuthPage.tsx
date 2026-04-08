import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Key, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await signIn(cleanEmail, password)
        : await signUp(cleanEmail, password, cleanName || cleanEmail.split("@")[0]);

      if (result.authenticated) {
        navigate("/chat");
      } else if (result.requiresEmailVerification) {
        setMode("login");
        setPassword("");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-primary border-4 border-foreground rounded-2xl flex items-center justify-center brutal-shadow">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter">BChat</h1>
          </div>
          <p className="text-muted-foreground text-lg font-bold">Simple. Secure. Reliable.</p>
        </div>

        <div className="p-8 bg-card border-4 border-foreground brutal-shadow">
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-1">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-muted-foreground font-bold">
              {mode === "login" ? "Enter your credentials" : "Join the network"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-widest text-muted-foreground">Full Name</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="brutal-input w-full pl-12 h-14 text-md font-bold"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-widest text-muted-foreground">Email Address</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="brutal-input w-full pl-12 h-14 text-md font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="brutal-input w-full pl-12 h-14 text-md font-bold"
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-xl font-black border-3 border-foreground" disabled={loading}>
              {loading ? "Processing..." : (
                <>
                  {mode === "login" ? "LOGIN" : "SIGN UP"}
                  <ArrowRight className="w-6 h-6 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-xs font-black uppercase tracking-widest hover:text-primary"
            >
              {mode === "login" ? "Need an account? Sign Up" : "Have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
