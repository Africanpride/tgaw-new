"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import type { SlotAccent } from "./slotAccent";
import {
  convertUtcTimeToLocal,
  isPastSlot,
} from "./slotTime";

export { convertUtcTimeToLocal, isPastSlot };

export interface SlotData {
  id: string;
  type?: string;
  date?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isOwnBooking: boolean;
  bookedByName: string | null;
  bookedByImage: string | null;
  notes: string | null;
}

interface SlotCellProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  accent: SlotAccent;
  isCurrent?: boolean;
}

export function SlotCell({ slot, isSelected, onSelect, accent, isCurrent }: SlotCellProps) {
  const isAvailable = !slot.isBooked && !isPastSlot(slot);
  const past = isPastSlot(slot);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={isSelected}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      whileHover={!past && isAvailable && !reduceMotion ? { scale: 1.01, x: 2 } : undefined}
      whileTap={!past && isAvailable && !reduceMotion ? { scale: 0.99 } : undefined}
      onClick={(e) => onSelect(slot.id, e.shiftKey)}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
      aria-label={`${convertUtcTimeToLocal(slot.startTime)} to ${convertUtcTimeToLocal(
        slot.endTime,
      )} slot, ${past ? "past" : isAvailable ? (isSelected ? "selected" : "available") : "booked"}${isCurrent ? " (current)" : ""}`}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(slot.id, e.shiftKey);
        }
      }}
      data-slot-id={slot.id}
      className={cn(
        "flex items-center border-b border-l-4 border-transparent px-3 transition-colors select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        past
          ? "min-h-[32px] cursor-default opacity-40"
          : "min-h-[44px] cursor-pointer py-2",
        !past && isAvailable && "hover:bg-muted/50",
        !past && !isAvailable && "cursor-not-allowed opacity-60",
        isSelected && isAvailable && cn(accent.tint, accent.rail),
        slot.isOwnBooking && !past && cn(accent.tintStrong, accent.rail),
        isCurrent && !past && "bg-primary/5 ring-1 ring-inset ring-primary/30",
      )}
    >
      <div className="w-20 shrink-0 font-medium text-sm tabular-nums">
        {convertUtcTimeToLocal(slot.startTime)}
      </div>

      <div className="ml-4 flex flex-1 items-center justify-between gap-2">
        {past ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Clock className="size-3" aria-hidden="true" />
            Past
          </span>
        ) : isAvailable ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", isSelected ? accent.dotStrong : "bg-muted-foreground/40")} />
            {isSelected ? "Selected" : "Available"}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant={slot.isOwnBooking ? "default" : "secondary"}
              className={cn(slot.isOwnBooking && cn(accent.solid))}
            >
              {slot.isOwnBooking ? "My booking" : "Booked"}
            </Badge>
            {slot.bookedByName && (
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={slot.bookedByName}
                  image={slot.bookedByImage}
                  className="size-6"
                />
                <span className="hidden text-sm font-medium sm:inline">
                  {slot.bookedByName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isSelected && isAvailable && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "ml-2 flex size-5 shrink-0 items-center justify-center rounded-full",
            accent.solid,
          )}
        >
          <Check className="size-3" aria-hidden="true" />
        </motion.span>
      )}
    </motion.div>
  );
}