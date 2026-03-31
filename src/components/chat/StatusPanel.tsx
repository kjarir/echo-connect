import { motion } from "framer-motion";
import { Plus, Eye } from "lucide-react";
import { mockStatuses, mockUsers } from "@/data/mockData";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { formatDistanceToNow } from "date-fns";

export const StatusPanel = () => {
  const myUser = mockUsers[0];

  return (
    <div className="p-4 space-y-6">
      {/* My Status */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">My Status</h3>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-3 border-foreground bg-card brutal-shadow-sm hover:brutal-shadow transition-all"
        >
          <div className="relative">
            <UserAvatar user={myUser} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-foreground rounded-full flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold">Add status</p>
            <p className="text-sm text-muted-foreground">Share what's on your mind</p>
          </div>
        </motion.button>
      </div>

      {/* Recent statuses */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Updates</h3>
        <div className="space-y-2">
          {mockStatuses.map(status => {
            const user = mockUsers.find(u => u.id === status.userId);
            if (!user) return null;
            return (
              <motion.div
                key={status.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border-3 border-foreground bg-card brutal-shadow-sm"
              >
                <div className="ring-3 ring-primary ring-offset-2 ring-offset-card rounded-xl">
                  <UserAvatar user={user} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{status.content}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-mono">{status.viewers.length}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
