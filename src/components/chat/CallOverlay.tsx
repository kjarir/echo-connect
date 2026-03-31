import React, { useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";

export const CallOverlay = () => {
  const { call, acceptCall, rejectCall, endCall, profiles, isMicMuted, isCameraOff, toggleMic, toggleCamera } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    let interval: any;
    if (call.isActive && !call.isIncoming) {
       interval = setInterval(() => {
         setDuration(prev => prev + 1);
       }, 1000);
    }
    return () => clearInterval(interval);
  }, [call.isActive, call.isIncoming]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, "0")}`;
  };

  const otherUser = profiles[call.otherUserId || ""];

  const otherName = otherUser?.name || "Initializing...";
  const otherAvatar = otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.otherUserId}`;


  useEffect(() => {
    if (call.stream && localVideoRef.current) {
      localVideoRef.current.srcObject = call.stream;
    }
  }, [call.stream]);

  useEffect(() => {
    if (call.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  if (!call.isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-card border-4 border-foreground w-full max-w-2xl rounded-3xl brutal-shadow flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b-4 border-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary border-3 border-foreground rounded-2xl overflow-hidden">
                <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{otherName}</h2>
                <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  {call.isIncoming ? "Incoming Call" : (call.remoteStream ? formatDuration(duration) : "Calling...")}
                </p>
              </div>
            </div>
            {call.isActive && !call.isIncoming && (
               <Button variant="ghost" size="icon" onClick={endCall} className="rounded-xl border-3 border-foreground">
                  <X className="w-6 h-6" />
               </Button>
            )}
          </div>

          {/* Main Area */}
          <div className="flex-1 bg-muted relative min-h-[400px] flex items-center justify-center">
            {/* Audio Bridge for Voice Calls */}
            <audio ref={remoteVideoRef as any} autoPlay playsInline />

            {call.type === "video" ? (
              <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4">
                <div className="flex-1 bg-black border-4 border-foreground rounded-2xl overflow-hidden relative">
                   <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                   {!call.remoteStream && (
                      <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xl font-bold">
                        Waiting for video...
                      </div>
                   )}
                </div>
                <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-black border-4 border-foreground rounded-2xl overflow-hidden">
                   <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 bg-primary/20 border-4 border-foreground rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Phone className="w-12 h-12" />
                </motion.div>
                <p className="text-xl font-bold">Voice Call Active</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-8 border-t-4 border-foreground flex items-center justify-center gap-6">
            {call.isIncoming ? (
              <>
                <Button 
                  onClick={acceptCall}
                  className="bg-green-500 hover:bg-green-600 border-4 border-foreground h-20 w-20 rounded-full brutal-shadow-sm transition-transform hover:scale-110"
                >
                  <Phone className="w-8 h-8 text-white" />
                </Button>
                <Button 
                  onClick={rejectCall}
                  className="bg-red-500 hover:bg-red-600 border-4 border-foreground h-20 w-20 rounded-full brutal-shadow-sm transition-transform hover:scale-110"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={toggleMic}
                  className={`h-16 w-16 rounded-full border-3 border-foreground ${isMicMuted ? "bg-red-200" : ""}`}
                >
                  {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                {call.type === "video" && (
                  <Button 
                    variant="outline" 
                    onClick={toggleCamera}
                    className={`h-16 w-16 rounded-full border-3 border-foreground ${isCameraOff ? "bg-red-200" : ""}`}
                  >
                    {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </Button>
                )}
                <Button 
                  onClick={endCall}
                  className="bg-red-500 hover:bg-red-600 border-4 border-foreground h-20 w-20 rounded-full brutal-shadow-sm transition-transform hover:scale-110"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </Button>

              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
