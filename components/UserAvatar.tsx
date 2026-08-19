import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Premium identity avatar: renders the user's image when available, otherwise
 * initials on a deterministic gradient derived from the name.
 */

const GRADIENTS = [
  "from-blue-500 to-violet-500",
  "from-amber-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-fuchsia-500 to-purple-500",
  "from-sky-500 to-indigo-500",
  "from-orange-500 to-pink-500",
] as const;

export function gradientForName(name?: string | null): string {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function initialsForName(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const gradient = gradientForName(name);
  const initials = initialsForName(name);

  return (
    <Avatar className={cn("size-9 shrink-0", className)}>
      {image ? (
        <AvatarImage src={image} alt={name ?? "User"} />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-linear-to-br text-white",
          gradient,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}