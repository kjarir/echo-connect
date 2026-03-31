import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate("/chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 bg-primary border-3 border-foreground rounded-xl flex items-center justify-center brutal-shadow">
              <MessageSquare className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">BrutalChat</h1>
          </motion.div>
          <p className="text-muted-foreground text-lg font-medium">
            Chat with attitude. No fluff.
          </p>
        </div>

        {/* Form Card */}
        <div className="brutal-card p-8">
          {/* Mode Toggle */}
          <div className="flex mb-8 border-3 border-foreground rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3 text-base font-bold transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 text-base font-bold transition-colors border-l-3 border-foreground ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="brutal-input w-full pl-12"
                    required
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="brutal-input w-full pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="brutal-input w-full pl-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  {mode === "login" ? "Let's Go" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Bold design. Real-time messaging. Zero BS.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
