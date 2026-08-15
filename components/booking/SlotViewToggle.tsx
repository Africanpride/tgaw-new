"use client";

import { motion, useReducedMotion } from "motion/react";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type SlotViewMode = "grid" | "list";

const options = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
] as const;

interface SlotViewToggleProps {
  view: SlotViewMode;
  onViewChange: (view: SlotViewMode) => void;
}

export function SlotViewToggle({ view, onViewChange }: SlotViewToggleProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(val) => {
        if (val) onViewChange(val as SlotViewMode);
      }}
      className="w-full justify-start gap-1 rounded-xl border bg-muted/40 p-1 sm:w-auto"
    >
      {options.map((item) => {
        const isActive = view === item.id;
        return (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            aria-label={`${item.label} view`}
            className="relative h-9 flex-1 cursor-pointer rounded-lg border-0 px-3.5 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/40 hover:text-foreground aria-pressed:bg-transparent! aria-pressed:text-primary-foreground! sm:flex-none"
          >
            <div className="relative z-10 flex items-center gap-2">
              <item.icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            {isActive && (
              <motion.div
                layoutId="slot-view-pill"
                initial={reduceMotion ? false : undefined}
                className="absolute inset-0 z-0 rounded-lg bg-primary"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
              />
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}