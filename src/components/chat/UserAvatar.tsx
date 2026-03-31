import { User } from "@/types/chat";

const colors = [
  "bg-primary", "bg-accent", "bg-secondary", "bg-destructive",
];

interface UserAvatarProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
  hasStory?: boolean;
  showOnline?: boolean;
}

export const UserAvatar = ({ user, size = "md", hasStory = false, showOnline = false }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  const ringStyles = ""; // Absolute removal of purple border/box


  if (!user || (!user.id && !user.name)) {
    return (
      <div className={`${sizeClasses[size]} bg-muted border-3 border-foreground rounded-full flex items-center justify-center animate-pulse`}>
         <span className="text-muted-foreground">?</span>
      </div>
    );
  }

  const getColorIndex = (id: string) => {
    let hash = 0;
    const key = id || user.name || "default";
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colors.length;
  };

  const colorIndex = getColorIndex(user.id || user.name);

  return (
    <div className={`relative shrink-0 transition-all duration-300 ${ringStyles}`}>
      <div className={`${sizeClasses[size]} bg-muted/20 border-3 border-foreground rounded-full flex items-center justify-center overflow-hidden`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-black text-foreground uppercase tracking-widest leading-none">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </div>
      {showOnline && user.id && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-3 border-card ${user.online ? "bg-online shadow-sm" : "bg-offline"}`} />
      )}
    </div>
  );
};
