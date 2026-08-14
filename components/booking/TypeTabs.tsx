"use client";

import { motion } from "motion/react";
import { EventType } from "@prisma/client";
import { BookOpen, HandHeart, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { slotAccent } from "./slotAccent";

interface TypeTabsProps {
  value: EventType;
  onChange: (value: EventType) => void;
}

const TABS: { value: EventType; label: string; short: string; icon: typeof BookOpen }[] = [
  { value: "BIBLE", label: "Bible Reading", short: "Bible", icon: BookOpen },
  { value: "PRAYER", label: "Prayer", short: "Prayer", icon: HandHeart },
  { value: "PRAISE_WORSHIP", label: "Praise & Worship", short: "Worship", icon: Music },
];

export function TypeTabs({ value, onChange }: TypeTabsProps) {
  return (
    <div className="flex w-full rounded-lg bg-muted/60 p-1" role="tablist">
      {TABS.map(({ value: v, label, short, icon: Icon }) => {
        const isActive = value === v;
        const accent = slotAccent[v];
        return (
          <button
            key={v}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v)}
            className={cn(
              "relative flex flex-1 h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? cn(accent.text)
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="booking-type-indicator"
                className={cn("absolute inset-0 rounded-md shadow-sm", accent.tabFill)}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="relative z-10 size-4" aria-hidden="true" />
            <span className="relative z-10 hidden sm:inline">{label}</span>
            <span className="relative z-10 sm:hidden">{short}</span>
          </button>
        );
      })}
    </div>
  );
}
