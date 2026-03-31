import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Key, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email);
      navigate("/chat"); // Redirect immediately in bypass mode
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate("/chat");
    } catch (err) {
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
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 bg-primary border-4 border-foreground rounded-2xl flex items-center justify-center brutal-shadow">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter">EchoConnect</h1>
          </motion.div>
          <p className="text-muted-foreground text-lg font-bold">
            Secure Encryption. Real-time Delivery.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 bg-card border-4 border-foreground brutal-shadow">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black mb-1">Welcome back</h2>
                  <p className="text-sm text-muted-foreground font-bold">Enter your email to receive a secure code</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black mb-2 uppercase tracking-widest text-muted-foreground pl-1">Email Address</label>
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

                  <Button type="submit" size="lg" className="w-full h-14 text-xl font-black border-3 border-foreground" disabled={loading}>
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        CONTINUE
                        <ArrowRight className="w-6 h-6 translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <button 
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-widest mb-8 hover:text-primary transition-colors pr-2 py-1 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Change Email
                </button>

                <div className="mb-8">
                  <h2 className="text-3xl font-black mb-1">Verify Code</h2>
                  <p className="text-sm text-muted-foreground font-bold truncate">Check inbox for {email}</p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black mb-2 uppercase tracking-widest text-muted-foreground pl-1">Secure Code</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        maxLength={8}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="••••••••"
                        className="brutal-input w-full pl-12 h-14 text-xl tracking-[0.3em] font-black text-center placeholder:tracking-normal"
                        required
                      />

                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full h-14 text-xl font-black border-3 border-foreground bg-primary text-primary-foreground" disabled={loading}>
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        ENTER CONSOLE
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-muted-foreground mt-10 text-xs font-black uppercase tracking-widest opacity-40">
          Peer-to-Peer. Encrypted. Eternal.
        </p>
      </motion.div>
    </div>
  );
};



export default AuthPage;

