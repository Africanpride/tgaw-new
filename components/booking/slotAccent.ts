import type { EventType } from "@prisma/client";

export interface SlotAccent {
  text: string;
  tabFill: string;
  solid: string;
  tint: string;
  tintStrong: string;
  rail: string;
  iconTile: string;
  dot: string;
  dotStrong: string;
}

export const slotAccent: Record<EventType, SlotAccent> = {
  BIBLE: {
    text: "text-purple-700 dark:text-purple-300",
    tabFill: "bg-purple-100 dark:bg-purple-900/60",
    solid: "bg-purple-600 text-white hover:bg-purple-700",
    tint: "bg-purple-500/10",
    tintStrong: "bg-purple-500/15",
    rail: "border-l-purple-500",
    iconTile: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200",
    dot: "bg-purple-500/50",
    dotStrong: "bg-purple-500",
  },
  PRAYER: {
    text: "text-red-700 dark:text-red-300",
    tabFill: "bg-red-100 dark:bg-red-900/60",
    solid: "bg-red-600 text-white hover:bg-red-700",
    tint: "bg-red-500/10",
    tintStrong: "bg-red-500/15",
    rail: "border-l-red-500",
    iconTile: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
    dot: "bg-red-500/50",
    dotStrong: "bg-red-500",
  },
  PRAISE_WORSHIP: {
    text: "text-amber-700 dark:text-amber-300",
    tabFill: "bg-amber-100 dark:bg-amber-900/60",
    solid: "bg-amber-600 text-white hover:bg-amber-700",
    tint: "bg-amber-500/10",
    tintStrong: "bg-amber-500/15",
    rail: "border-l-amber-500",
    iconTile: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
    dot: "bg-amber-500/50",
    dotStrong: "bg-amber-500",
  },
};