import { mockUsers } from "@/data/mockData";
import { User } from "@/types/chat";

const colors = [
  "bg-primary", "bg-secondary", "bg-accent", "bg-destructive",
];

export const UserAvatar = ({ user, size = "md", showOnline = false }: {
  user: User;
  size?: "sm" | "md" | "lg";
  showOnline?: boolean;
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  const colorIndex = parseInt(user.id) % colors.length;

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} ${colors[colorIndex]} border-3 border-foreground rounded-xl flex items-center justify-center font-bold text-primary-foreground brutal-shadow-sm`}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      {showOnline && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
            user.online ? "bg-online" : "bg-offline"
          }`}
        />
      )}
    </div>
  );
};

export const getUser = (id: string): User =>
  mockUsers.find(u => u.id === id) || mockUsers[0];
