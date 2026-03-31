import { motion } from "framer-motion";
import { Plus, Eye, X, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const StatusPanel = () => {
  const { statuses, postStatus, viewStatus, deleteStatus, uploadMedia, profiles, chats } = useChat();
// ... (omitting some unchanged code for brevity, but I will include it in the real call)

  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);

  const handleAddStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Broadcasting status...");
    const url = await uploadMedia(file);
    if (url) {
      await postStatus(url, file.type.startsWith("video/") ? "video" : "image");
      toast.success("Broadcast successful!", { id: toastId });
    } else {
      toast.error("Upload failed", { id: toastId });
    }
  };

  const myStatuses = statuses.filter(s => s.user_id === currentUser?.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const myUserStatus = myStatuses[0];

  // Logic: Only show status from users we have already chatted with
  const connectedUserIds = new Set(chats.flatMap(c => c.participants));
  
  const groupedStatuses = statuses.reduce((acc, status) => {
    if (status.user_id === currentUser?.id) return acc;
    if (!connectedUserIds.has(status.user_id)) return acc;

    if (!acc[status.user_id]) acc[status.user_id] = [];
    acc[status.user_id].push(status);
    return acc;
  }, {} as Record<string, typeof statuses>);

  const handleOpenStatus = (status: any) => {
    setSelectedStatus(status);
    viewStatus(status.id);
  };

  return (
    <div className="p-4 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleAddStatus} className="hidden" accept="image/*,video/*" />
      
      {/* My Status */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 px-1">IDENTITY & BROADCAST</h3>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => myUserStatus ? handleOpenStatus(myUserStatus) : fileInputRef.current?.click()}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-sm hover:brutal-shadow transition-all group overflow-hidden"
        >
          <div className="relative shrink-0">
             <UserAvatar user={currentUser!} hasStory={!!myUserStatus} />
             {!myUserStatus && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-foreground rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 text-primary-foreground font-bold" />
              </div>
            )}
          </div>

          <div className="text-left flex-1 min-w-0 pr-4">
            <p className="font-black text-sm truncate uppercase tracking-tight">
               {myUserStatus ? (profiles[myUserStatus.user_id]?.name || currentUser?.name) : "Add Status"}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">
               {myUserStatus ? `Status uploaded ${formatDistanceToNow(new Date(myUserStatus.created_at))} ago` : "Share a moment"}
            </p>
          </div>
          {myUserStatus && (
             <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg border-2 border-foreground box-border">
                   <Eye className="w-3 h-3" />
                   <span className="text-[10px] font-black font-mono">{myUserStatus.viewers?.length || 0}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteStatus(myUserStatus.id); }}
                  className="p-1.5 bg-destructive text-destructive-foreground border-2 border-foreground rounded-lg hover:scale-110 transition-transform"
                >
                   <Trash2 className="w-3.5 h-3.5" />
                </button>
             </div>
          )}

        </motion.button>
        {myUserStatus && (
            <button 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-primary hover:underline border-2 border-dashed border-primary/30 rounded-lg"
            >
              Post New Sequence
            </button>
        )}
      </div>

      {/* Recent statuses */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 px-1">CONNECTED SIGNALS</h3>
        <div className="space-y-3">
          {Object.entries(groupedStatuses).map(([userId, userStatuses]) => {
            const profile = profiles[userId];
            const latestStatus = userStatuses[0];
            
            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleOpenStatus(latestStatus)}
                className="flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground bg-card brutal-shadow-sm hover:brutal-shadow transition-all cursor-pointer group"
              >
                <div className="shrink-0">
                  <UserAvatar user={profile || { id: userId, name: "...", avatar: "", phone: "", bio: "", online: false, last_seen: "" }} hasStory={true} />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-black text-sm truncate uppercase tracking-tight">{profile?.name || "Initializing..."}</p>
                  <p className="text-[10px] font-bold text-muted-foreground font-mono mt-0.5">
                    {formatDistanceToNow(new Date(latestStatus.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg border-2 border-foreground shrink-0 box-border">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] font-black font-mono">{latestStatus.viewers?.length || 0}</span>
                </div>
              </motion.div>
            );
          })}
          {Object.keys(groupedStatuses).length === 0 && (
            <div className="p-10 text-center border-3 border-dashed border-foreground/10 rounded-3xl bg-muted/5">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Waiting for incoming signals...</p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStatus} onOpenChange={(open) => !open && setSelectedStatus(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-4 border-foreground brutal-shadow rounded-3xl bg-black">
          <div className="relative w-full aspect-[9/16] md:aspect-video flex items-center justify-center bg-black">
            {selectedStatus?.type === "video" ? (
              <video src={selectedStatus?.content} controls autoPlay className="max-h-full max-w-full object-contain" />
            ) : (
              <img src={selectedStatus?.content} alt="Story" className="max-h-full max-w-full object-contain" />
            )}
            
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-4">
                <UserAvatar user={profiles[selectedStatus?.user_id] || { id: "0", name: "...", avatar: "", phone: "", bio: "", online: false, last_seen: "" }} />
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl tracking-tight drop-shadow-xl">
                    {profiles[selectedStatus?.user_id]?.name || "SIGNAL CORE"}
                  </span>
                  <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                    {selectedStatus && formatDistanceToNow(new Date(selectedStatus.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedStatus(null)}
                className="text-white hover:bg-white/20 pointer-events-auto rounded-full bg-black/40 border border-white/10"
              >
                <X className="w-8 h-8" />
              </Button>
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-3 bg-white/15 backdrop-blur-xl rounded-2xl border-2 border-white/30 z-20 brutal-shadow-sm">
               <Eye className="w-5 h-5 text-white" />
               <span className="text-white font-black text-xs uppercase tracking-widest font-mono">
                  {selectedStatus?.viewers?.length || 0} COMREDS IDENTIFIED
               </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
