"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type SlotViewMode = "grid" | "list";

const options = [
  { id: "grid", icon: LayoutGrid },
  { id: "list", icon: List },
] as const;

interface SlotViewToggleProps {
  view: SlotViewMode;
  onViewChange: (view: SlotViewMode) => void;
  className?: string;
}

export function SlotViewToggle({ view, onViewChange, className }: SlotViewToggleProps) {
  const { t } = useTranslation("booking");
  const reduceMotion = useReducedMotion();

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(val) => {
        if (val) onViewChange(val as SlotViewMode);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border/50 bg-muted/60 p-1 shadow-2xs w-full sm:w-auto justify-start",
        className
      )}
    >
      {options.map((item) => {
        const isActive = view === item.id;
        const itemLabel = t(`view.${item.id}`);
        return (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            aria-label={t("view.aria", { label: itemLabel })}
            className="relative h-8 flex-1 cursor-pointer select-none rounded-lg border-0 px-2 sm:px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-background/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=on]:bg-transparent! data-[state=on]:text-foreground! data-[state=on]:font-semibold data-[state=on]:hover:bg-transparent! sm:flex-none"
          >
            <div className="relative z-10 flex items-center justify-center gap-1.5">
              <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{itemLabel}</span>
            </div>
            {isActive && (
              <motion.div
                layoutId="slot-view-pill"
                initial={reduceMotion ? false : undefined}
                className="absolute inset-0 z-0 rounded-lg border border-border/40 bg-background shadow-xs"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 30 }
                }
              />
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}