export interface SlotAccent {
  text: string;
  iconText: string;
  tabFill: string;
  solid: string;
  tint: string;
  tintStrong: string;
  rail: string;
  iconTile: string;
  dot: string;
  dotStrong: string;
  mine: string;
  booked: string;
  available: string;
}

/**
 * Shared visual language for slots blocked by a Special Event (precedence):
 * violet, matching SPECIAL events' identity on /calendar. Used by the
 * devotion strips and the /booking timeline/grid alike.
 */
export const EVENT_BLOCK = {
  text: "text-violet-700 dark:text-violet-300",
  solid: "bg-violet-600 text-white dark:bg-violet-500",
  tint: "bg-violet-500/10 dark:bg-violet-500/20",
  tintStrong: "bg-violet-500/15 dark:bg-violet-500/25",
  rail: "border-l-violet-500",
  border: "border-violet-500/40",
} as const;

export const slotAccent: Record<string, SlotAccent> = {
  BIBLE: {
    text: "text-purple-700 dark:text-purple-300",
    iconText: "text-purple-500",
    tabFill: "bg-purple-200 dark:bg-purple-800",
    solid: "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600",
    tint: "bg-purple-500/10 dark:bg-purple-500/20",
    tintStrong: "bg-purple-500/20 dark:bg-purple-500/30",
    rail: "border-l-purple-500",
    iconTile: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200",
    dot: "bg-purple-500/50",
    dotStrong: "bg-purple-500",
    mine: "bg-purple-500/15 border-purple-500/50 text-purple-700 dark:text-purple-300 dark:bg-purple-950/60 shadow-xs ring-1 ring-purple-500/30",
    booked: "bg-slate-100/90 border-slate-200/80 text-slate-500 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-400",
    available: "bg-background hover:bg-purple-500/10 hover:border-purple-500/40 border-border text-foreground",
  },
  PRAYER: {
    text: "text-red-700 dark:text-red-300",
    iconText: "text-red-500",
    tabFill: "bg-red-200 dark:bg-red-800",
    solid: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    tint: "bg-red-500/10 dark:bg-red-500/20",
    tintStrong: "bg-red-500/20 dark:bg-red-500/30",
    rail: "border-l-red-500",
    iconTile: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
    dot: "bg-red-500/50",
    dotStrong: "bg-red-500",
    mine: "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-300 dark:bg-red-950/60 shadow-xs ring-1 ring-red-500/30",
    booked: "bg-slate-100/90 border-slate-200/80 text-slate-500 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-400",
    available: "bg-background hover:bg-red-500/10 hover:border-red-500/40 border-border text-foreground",
  },
  PRAISE_WORSHIP: {
    text: "text-amber-700 dark:text-amber-300",
    iconText: "text-amber-500",
    tabFill: "bg-amber-200 dark:bg-amber-800",
    solid: "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
    tint: "bg-amber-500/10 dark:bg-amber-500/20",
    tintStrong: "bg-amber-500/20 dark:bg-amber-500/30",
    rail: "border-l-amber-500",
    iconTile: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
    dot: "bg-amber-500/50",
    dotStrong: "bg-amber-500",
    mine: "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 dark:bg-amber-950/60 shadow-xs ring-1 ring-amber-500/30",
    booked: "bg-slate-100/90 border-slate-200/80 text-slate-500 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-400",
    available: "bg-background hover:bg-amber-500/10 hover:border-amber-500/40 border-border text-foreground",
  },
};