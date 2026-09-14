import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconTileSize = "sm" | "md" | "lg";

const TILE_SIZES: Record<IconTileSize, string> = {
  sm: "size-7 rounded-md",
  md: "size-10 rounded-xl",
  lg: "size-14 rounded-xl",
};

const ICON_SIZES: Record<IconTileSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
};

interface IconTileProps {
  icon: LucideIcon;
  size?: IconTileSize;
  /** Tile background/text classes. Defaults to the primary tint. */
  tone?: string;
  iconClassName?: string;
  className?: string;
}

/**
 * Shared squircle icon tile. One tile language everywhere:
 * sm for compact headers, md for section/card headers, lg for empty states.
 */
export function IconTile({
  icon: Icon,
  size = "md",
  tone = "bg-primary/10 text-primary",
  iconClassName,
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        TILE_SIZES[size],
        tone,
        className,
      )}
    >
      <Icon className={cn(ICON_SIZES[size], iconClassName)} aria-hidden="true" />
    </span>
  );
}
