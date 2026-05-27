import { useState } from "react";

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-base"
};

export default function UserAvatar({ user, size = "md", className = "" }) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const avatarUrl = typeof user?.avatarUrl === "string" ? user.avatarUrl.trim() : "";
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const showImage = avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <span
      className={`relative flex shrink-0 overflow-hidden rounded-md bg-[var(--accent-soft)] font-bold text-[var(--accent)] ${sizeClass} ${className}`}
      aria-label={`${user?.name || "Workspace user"} avatar`}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedAvatarUrl(avatarUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{initial}</span>
      )}
    </span>
  );
}
