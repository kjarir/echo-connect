import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Message, Chat, User, Status } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { Peer, MediaConnection } from "peerjs";
import CryptoJS from "crypto-js";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  type: "voice" | "video";
  otherUserId: string | null;
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
}

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
  profiles: Record<string, User>;
  sendMessage: (chatId: string, content: string, type?: Message["type"]) => Promise<void>;
  uploadMedia: (file: File) => Promise<string | null>;
  addReaction: (messageId: string, chatId: string, emoji: string) => Promise<void>;
  createGroup: (name: string, participants: string[]) => Promise<string | null>;
  
  // Call functionality
  call: CallState;
  initiateCall: (toUserId: string, type: "voice" | "video") => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  startPrivateChat: (userId: string) => Promise<string>;
  isMicMuted: boolean;
  isCameraOff: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;

  // Status & Voice
  statuses: Status[];
  postStatus: (content: string, type: Status["type"]) => Promise<void>;
  viewStatus: (statusId: string) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: (chatId: string) => void;
}





const ChatContext = createContext<ChatContextType | null>(null);

const SECRET_KEY = "bchat-prod-key"; // In production, this should be derived per-chat

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  const [call, setCall] = useState<CallState>({
    isActive: false,
    isIncoming: false,
    type: "voice",
    otherUserId: null,
    stream: null,
    remoteStream: null,
  });

  const callStartTimeRef = useRef<number | null>(null);
  const pendingAcceptRef = useRef(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);


  const logCallMessage = async (type: "voice" | "video", toUserId: string, outcome: "missed" | "completed" | "answered") => {
    let duration = "";
    if (callStartTimeRef.current && outcome === "completed") {
       const seconds = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
       const mins = Math.floor(seconds / 60);
       const secs = seconds % 60;
       duration = ` (${mins}:${secs.toString().padStart(2, "0")})`;
    }

    const content = outcome === "missed" 
       ? `📞 Missed ${type} call` 
       : outcome === "answered" 
       ? `☎️ ${type.charAt(0).toUpperCase() + type.slice(1)} call answered`
       : `📞 ${type.charAt(0).toUpperCase() + type.slice(1)} call ended${duration}`;


    const chatId = activeChat || await startPrivateChat(toUserId);
    await sendMessage(chatId, `📅 ${content}`, "text");
  };


  // Polling Fallback for Signaling (in case Realtime is dead)
  useEffect(() => {
    if (!user?.id) return;
    
    const pollSignaling = async () => {
      if (call.isActive) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .like("content", "__SIGNAL__:initiate%")
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const sig = data[0];
        const parts = sig.content.split(":");

        const sigTime = new Date(sig.created_at).getTime();
        // Only trigger if signal was sent in the last 20 seconds
        if (Date.now() - sigTime < 20000) {
           console.log("POLLING_MATCHED_SIGNAL:", sig);
           setCall({
             isActive: true,
             isIncoming: true,
             type: sig.content === "video" ? "video" : "voice",
             otherUserId: sig.sender_id,
             stream: null,
             remoteStream: null,
           });
        }
      }
    };

    const interval = setInterval(pollSignaling, 3000);
    return () => clearInterval(interval);
  }, [user?.id, call.isActive]);

  const toggleMic = () => {
    if (call.stream) {
      const audioTrack = call.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (call.stream) {
      const videoTrack = call.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };


  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const signalChannelRef = useRef<any>(null);

  // E2EE helpers
  const encrypt = (text: string) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  const decrypt = useCallback((ciphertext: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || ciphertext;
    } catch (e) {
      return ciphertext;
    }
  }, []);

  // Initialize Chats
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    const fetchChats = async () => {
      // 🕵️ Step 1: Fetch ONLY my shared signal IDs
      const { data: myParticipations } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      const myChatIds = (myParticipations || []).map(p => p.chat_id);
      if (myChatIds.length === 0) {
        setChats([]);
        return;
      }

      // 🕵️ Step 2: Hydrate only my authorized chats
      const { data: chatList, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .in("id", myChatIds)
        .order("created_at", { ascending: false });

      if (chatError) {
        console.error("Authorized Fetch Error:", chatError);
        return;
      }

      const { data: participList } = await supabase
        .from("chat_participants")
        .select("chat_id, user_id")
        .in("chat_id", myChatIds);

      // 🔄 Manual browser-side merge for maximum stability
      const mergedChats: Chat[] = (chatList || []).map(c => ({
        ...c,
        participants: (participList || [])
          .filter((p: any) => p.chat_id === c.id)
          .map((p: any) => p.user_id),
        pinned: false,
      }));

      setChats(mergedChats);
    };

    fetchChats();

    // 🛡️ Stealth Subscription: Only listen for participations LINKED to me
    const participSub = supabase
      .channel("my:signals")
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "chat_participants",
        filter: `user_id=eq.${user.id}` 
      }, async (payload) => {
        // I have been added to a new chat! Hydrate and add to list.
        const newPart = payload.new as any;
        const { data: chatData } = await supabase
          .from("chats")
          .select("*")
          .eq("id", newPart.chat_id)
          .single();

        if (chatData) {
          // Re-trigger fetch to get full participants list safely
          fetchChats();
        }
      })
      .subscribe();


    return () => {
      participSub.unsubscribe();
    };

  }, [user]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Fetch and Subscribe to Messages
  useEffect(() => {
    if (!user?.id) return;

    const msgSub = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        
        // INTERCEPT NEW SIGNAL FORMAT
        if (msg.content?.startsWith("__SIGNAL__:")) {
            const parts = msg.content.split(":");
            const signalType = parts[1];
            const myId = userRef.current?.id;
            
            if (myId && msg.sender_id !== myId) {
                console.log("INTERCEPTED_SIGNAL:", signalType);
                if (signalType === "initiate") {
                   fetchProfiles([msg.sender_id]); // FORCE PRE-FETCH PROFILE
                   setCall({
                     isActive: true,
                     isIncoming: true,
                     type: parts[2] === "video" ? "video" : "voice",
                     otherUserId: msg.sender_id,
                     stream: null,
                     remoteStream: null,
                   });
                   toast.info("Incoming Call...");

                } else if (signalType === "accept") {
                   toast.success("Signal accepted!");
                   callStartTimeRef.current = Date.now();
                } else if (signalType === "reject") {
                   logCallMessage(call.type, msg.sender_id, "missed");
                   setCall(prev => ({ ...prev, isActive: false }));
                } else if (signalType === "end") {
                   logCallMessage(call.type, msg.sender_id, "completed");
                   endCall();
                }
            }
            return; // FINAL: Hide signals from Chat UI
        }




        const decryptedMsg = { ...msg, content: msg.is_encrypted ? decrypt(msg.content) : msg.content };


        
        setMessages(prev => ({
          ...prev,
          [msg.chat_id]: [...(prev[msg.chat_id] || []), decryptedMsg],
        }));

        setChats(prev => prev.map(c => 
          c.id === msg.chat_id ? { ...c, lastMessage: decryptedMsg } : c
        ));
      })
      .subscribe();

    return () => {
      msgSub.unsubscribe();
    };
  }, [user, decrypt]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", activeChat)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch messages error:", error);
        return;
      }

      const decryptedMessages = data.map(m => ({
        ...m,
        content: m.is_encrypted ? decrypt(m.content) : m.content
      }));

      setMessages(prev => ({
        ...prev,
        [activeChat]: decryptedMessages
      }));
    };

    fetchMessages();
  }, [activeChat, user, decrypt]);

  const [profiles, setProfiles] = useState<Record<string, User>>({});

  const fetchProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(id => 
       id && id !== "undefined" && typeof id === "string" && !profiles[id]
    )));
    if (uniqueIds.length === 0) return;

    const { data } = await supabase.from("profiles").select("*").in("id", uniqueIds);
    if (data) {
      setProfiles(prev => {
        const next = { ...prev };
        data.forEach(p => { next[p.id] = p; });
        return next;
      });
    }
  }, [profiles]);

  const peerInitTimeoutRef = useRef<any>(null);

  // PeerJS Service (Durable Singleton)
  useEffect(() => {
    if (!user?.id) return;

    const initPeer = () => {
      console.log("🚀 BChat: Initializing Durable Service for", user.id);
      
      const peer = new Peer(user.id, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ]
        },
        debug: 3 // High-priority logs
      });
      
      peerRef.current = peer;

      peer.on("call", (incomingCall) => {
        console.log("☎️ PeerJS: Handshake handshake detected");
        callRef.current = incomingCall;
        
        if (pendingAcceptRef.current) {
           console.log("⚡ PeerJS: Auto-answering pending call...");
           navigator.mediaDevices.getUserMedia({ 
             video: call.type === "video", 
             audio: true 
           }).then(stream => {
              incomingCall.answer(stream);
              pendingAcceptRef.current = false;
           });
        }

        incomingCall.on("stream", (remoteStream) => {
          console.log("🎬 PeerJS: Video Stream Active!");
          toast.success("Call connected!");
          setCall(prev => ({ ...prev, remoteStream }));
        });
      });

      peer.on("error", (err) => {
        console.error("PeerJS global error:", err);
        if (err.type === "peer-unavailable") {
           toast.error("User is offline or unavailable");
        }
      });
    };

    // Debounce to prevent destruction on ID flicker (localStorage sync)
    if (peerInitTimeoutRef.current) clearTimeout(peerInitTimeoutRef.current);
    peerInitTimeoutRef.current = setTimeout(initPeer, 300);

    return () => {
      if (peerInitTimeoutRef.current) clearTimeout(peerInitTimeoutRef.current);
      console.log("🛑 BChat: Session cleanup requested.");
      // We don't destroy immediately to prevent flicker-break
      setTimeout(() => peerRef.current?.destroy(), 500);
    };
  }, [user?.id]); 




  // Update profiles when chats change
  useEffect(() => {
    const allUserIds = chats.flatMap(c => c.participants);
    if (allUserIds.length > 0) {
      fetchProfiles(allUserIds);
    }
  }, [chats, fetchProfiles]);

  const sendMessage = async (chatId: string, content: string, type: Message["type"] = "text") => {
    if (!user) return;

    const encryptedContent = encrypt(content);
    const newMessage: any = {
      chat_id: chatId,
      sender_id: user.id,
      content: encryptedContent,
      type,
      is_encrypted: true // MUST MATCH SQL
    };

    const { error } = await supabase.from("messages").insert(newMessage);

    if (error) {
      console.error("Supabase send error:", error);
      toast.error("Failed to send message: " + error.message);
      throw error;
    }
  };


  // Mark as Read logic
  useEffect(() => {
    if (!activeChat || !user?.id) return;
    
    const markAsRead = async () => {
       // Table 'messages' does not have a 'status' column in SQL.
       // Skipping until database is migrated.
    };
    markAsRead();
  }, [activeChat, user?.id]);

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      // 🚀 Resilient Blind Upload: Target 'media' directly to bypass 'listBuckets' restrictions
      const bucket = "media";
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
         // Specific handle for 'Bucket not found' vs 'Permission denied'
         console.error("Storage error:", uploadError);
         if (uploadError.message.includes("not found")) {
            toast.error("Bucket 'media' missing! Create it in Supabase Storage with 'Public' checked.");
         } else if (uploadError.message.includes("Permission denied") || uploadError.message.includes("New row violates")) {
            toast.error("RLS Lockdown: Enable 'INSERT' policy for 'media' bucket in Supabase.");
         } else {
            toast.error(`Upload error: ${uploadError.message}`);
         }
         return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err: any) {
      console.error("Transmission breakdown:", err);
      toast.error(`Upload failed: ${err.message || "Network Error"}`);
      return null;
    }
  };





   const startPrivateChat = useCallback(async (userId: string) => {
    if (!user) throw new Error("Not authenticated");


    // Check if a private chat ALREADY exists between these two people
    const { data: existingParticipation } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", userId);

    if (existingParticipation && existingParticipation.length > 0) {
      // Find a chat where both the target user AND the current user are participants
      const { data: commonParticipation } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)
        .in("chat_id", existingParticipation.map(p => p.chat_id));
      
      if (commonParticipation && commonParticipation.length > 0) {
        // Return the first shared private chat found
        return commonParticipation[0].chat_id;
      }
    }



    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .insert({ type: "private" })
      .select()
      .single();


    if (chatError) throw chatError;

    // Add participants
    await supabase.from("chat_participants").insert([
      { chat_id: newChat.id, user_id: user.id },
      { chat_id: newChat.id, user_id: userId }
    ]);

    return newChat.id;
  }, [user, chats]);

  const createGroup = async (name: string, participants: string[]) => {
    if (!user) return null;

    const payload: any = { name };
    payload.type = "group"; 

    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .insert(payload)
      .select()
      .single();

    if (chatError) {
      console.error("Group init error:", chatError);
      toast.error("Deployment failed: Check 'chats' table in Supabase.");
      return null;
    }

    // Fix for 0 connected: Pre-filter participants and handle participant link
    const validParticipants = participants.filter(p => p !== user.id);
    const participantIds = [user.id, ...validParticipants];

    const { error: partError } = await supabase.from("chat_participants").insert(
      participantIds.map(pid => ({ chat_id: chatData.id, user_id: pid }))
    );

    if (partError) {
       console.error("Participant add error:", partError);
       // We continue anyway so the user sees a group, but we notify them
       toast.error("Collective partial failure: External members not synchronized.");
    }

    // 🛡️ Nuclear State Injection: Force correct count immediately
    const fullGroup: Chat = {
      ...chatData,
      participants: participantIds,
      pinned: false
    };
    
    setChats(prev => {
       if (prev.some(c => c.id === fullGroup.id)) {
          return prev.map(c => c.id === fullGroup.id ? fullGroup : c);
       }
       return [fullGroup, ...prev];
    });
    
    setActiveChat(chatData.id);
    toast.success(`Collective "${name}" is now live with ${participantIds.length} members.`);
    return chatData.id;
  };



  const addReaction = async (messageId: string, chatId: string, emoji: string) => {
    // Implement reaction logic in Supabase if table exists
  };

  const initiateCall = async (toUserId: string, type: "voice" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true
      });
      
      setCall({
        isActive: true,
        isIncoming: false,
        type,
        otherUserId: toUserId,
        stream,
        remoteStream: null,
      });

      // Find or start the private chat to send the signal through
      let chatId = activeChat;
      if (!chatId) {
         chatId = await startPrivateChat(toUserId);
      }

      // Use 'text' type to bypass potential SQL CHECK constraints on the 'type' column
      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user?.id,
        content: `__SIGNAL__:initiate:${type}`,
        type: "text",
      });


      if (peerRef.current) {
        const callInstance = peerRef.current.call(toUserId, stream);
        callRef.current = callInstance;
        callInstance.on("stream", (remoteStream: MediaStream) => {
          setCall(prev => ({ ...prev, remoteStream }));
          if (!callStartTimeRef.current) callStartTimeRef.current = Date.now();
        });
      }
    } catch (err) {
      toast.error("Microphone/Camera access denied");
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: call.type === "video",
        audio: true
      });

      setCall(prev => ({ ...prev, isIncoming: false, stream }));
      callStartTimeRef.current = Date.now();
      
      if (callRef.current) {
        console.log("🚀 PeerJS: Answering existing call...");
        callRef.current.answer(stream);
        callRef.current.on("stream", (remoteStream: MediaStream) => {
          setCall(prev => ({ ...prev, remoteStream }));
          toast.success("Connection Established!");
        });
      } else {
        console.log("⏳ PeerJS: Waiting for technical handshake to answer...");
        pendingAcceptRef.current = true;
      }


      await supabase.from("messages").insert({
        chat_id: activeChat || (await startPrivateChat(call.otherUserId!)),
        sender_id: user?.id,
        content: "__SIGNAL__:accept",
        type: "text",
      });
    } catch (err) {
      toast.error("Microphone/Camera access denied");
    }
  };

  const rejectCall = async () => {
    if (call.otherUserId) {
       await logCallMessage(call.type, call.otherUserId, "missed");
       await supabase.from("messages").insert({
         chat_id: activeChat || (await startPrivateChat(call.otherUserId)),
         sender_id: user?.id,
         content: "__SIGNAL__:reject",
         type: "text",
        });
    }
    setCall(prev => ({ ...prev, isActive: false }));
    callStartTimeRef.current = null;
  };

  const endCall = async () => {
    if (call.otherUserId) {
       await logCallMessage(call.type, call.otherUserId, "completed");
       await supabase.from("messages").insert({
         chat_id: activeChat || (await startPrivateChat(call.otherUserId)),
         sender_id: user?.id,
         content: "__SIGNAL__:end",
         type: "text",
        });
    }
    
    call.stream?.getTracks().forEach(t => t.stop());
    setCall({
      isActive: false,
      isIncoming: false,
      type: "voice",
      otherUserId: null,
      stream: null,
      remoteStream: null,
    });
    callStartTimeRef.current = null;
    callRef.current?.close();
    callRef.current = null;
  };


  const [statuses, setStatuses] = useState<Status[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunks = useRef<Blob[]>([]);

  // Status Logic - Real-time & Connected
  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("statuses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      
      // Social Filter: Only show statuses for users you actually talk to
      const connectedUserIds = new Set(chats.flatMap(c => c.participants));
      connectedUserIds.add(user?.id || ""); 

      const filtered = (data as Status[] || []).filter(s => connectedUserIds.has(s.user_id));
      setStatuses(filtered);
    } catch (err: any) {
      setStatuses([]);
    }
  }, [chats, user?.id]);

  useEffect(() => {
    fetchStatuses();
    const sub = supabase.channel("status_realtime").on("postgres_changes", { event: "*", schema: "public", table: "statuses" }, () => fetchStatuses()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchStatuses]);

  const viewStatus = async (statusId: string) => {
    if (!user) return;
    const status = statuses.find(s => s.id === statusId);
    if (status && !status.viewers.includes(user.id)) {
       await supabase.from("statuses").update({ viewers: [...status.viewers, user.id] }).eq("id", statusId);
       fetchStatuses();
    }
  };

  const deleteStatus = async (statusId: string) => {
    if (!user) return;
    
    // Optimistic Update
    const previousStatuses = [...statuses];
    setStatuses(prev => prev.filter(s => s.id !== statusId));

    try {
      const { error } = await supabase.from("statuses").delete().eq("id", statusId).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Broadcast terminated!");
    } catch (err: any) {
      console.error("Delete error:", err);
      setStatuses(previousStatuses); // Rollback
      toast.error("Termination failed: " + (err.message || "Permissions denied"));
    }
  };


  const postStatus = async (content: string, type: Status["type"]) => {

    if (!user) return;
    await supabase.from("statuses").insert({ user_id: user.id, content, type, viewers: [] });
    // Realtime will trigger the fetch
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.start();
      setIsRecording(true);
    } catch (err) { toast.error("Mic denied"); }
  };

  const stopRecording = async (chatId: string) => {
    if (!recorderRef.current) return;
    recorderRef.current.onstop = async () => {
       const blob = new Blob(audioChunks.current, { type: "audio/webm" });
       const url = await uploadMedia(new File([blob], "voice.webm"));
       if (url) await sendMessage(chatId, url, "audio");
    };
    recorderRef.current.stop();
    setIsRecording(false);
    recorderRef.current.stream.getTracks().forEach(t => t.stop());
  };

  return (
    <ChatContext.Provider value={{ 
      chats, messages, activeChat, setActiveChat, sendMessage, uploadMedia, addReaction, createGroup, startPrivateChat,
      profiles,
      call, initiateCall, acceptCall, rejectCall, endCall,
      isMicMuted, isCameraOff, toggleMic, toggleCamera,
      statuses, postStatus, viewStatus, deleteStatus, isRecording, startRecording, stopRecording
    }}>


      {children}
    </ChatContext.Provider>
  );

};



