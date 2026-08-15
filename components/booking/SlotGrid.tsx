"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CalendarX2, Check, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SlotData,
  convertUtcTimeToLocal,
  isCurrentSlot,
  isPastSlot,
} from "./SlotCell";
import { slotAccent } from "./slotAccent";
import type { SlotAccent } from "./slotAccent";
import { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SlotGridProps {
  slots: SlotData[];
  type: EventType;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEmptyAction?: () => void;
}

export function SlotGrid({
  slots,
  type,
  selectedIds,
  onSelectionChange,
  onEmptyAction,
}: SlotGridProps) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const accent = slotAccent[type];

  useEffect(() => {
    if (!scrollRef.current) return;
    const current = slots.find((s) => isCurrentSlot(s));
    if (!current) return;
    const el = scrollRef.current.querySelector(`[data-slot-id="${current.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [slots]);

  const handleSelect = (id: string, shiftKey: boolean) => {
    const targetSlot = slots.find((s) => s.id === id);
    if (!targetSlot || targetSlot.isBooked || isPastSlot(targetSlot)) return;

    if (shiftKey && lastSelectedId) {
      const startIndex = slots.findIndex((s) => s.id === lastSelectedId);
      const endIndex = slots.findIndex((s) => s.id === id);
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      const newSelection: string[] = [];
      let canSelectAll = true;
      for (let i = min; i <= max; i++) {
        if (slots[i].isBooked || isPastSlot(slots[i])) {
          canSelectAll = false;
          break;
        }
        newSelection.push(slots[i].id);
      }
      if (canSelectAll) {
        onSelectionChange(
          Array.from(new Set([...selectedIds, ...newSelection])),
        );
      }
    } else {
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((sId) => sId !== id)
          : [...selectedIds, id],
      );
      setLastSelectedId(id);
    }
  };

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border py-14 text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            accent.iconTile,
          )}
        >
          <CalendarX2 className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium">No slots for this day</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          This day is quiet. Pick another day on the calendar to keep your
          devotional watch.
        </p>
        {onEmptyAction && (
          <Button variant="outline" size="sm" onClick={onEmptyAction} className="mt-1">
            Pick another day
          </Button>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[560px] w-full max-w-full overflow-hidden rounded-md border">
      <div
        ref={scrollRef}
        className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {slots.map((slot) => (
          <SlotGridCell
            key={slot.id}
            slot={slot}
            isSelected={selectedIds.includes(slot.id)}
            onSelect={handleSelect}
            accent={accent}
            isCurrent={isCurrentSlot(slot)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface SlotGridCellProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  accent: SlotAccent;
  isCurrent?: boolean;
}

function SlotGridCell({
  slot,
  isSelected,
  onSelect,
  accent,
  isCurrent,
}: SlotGridCellProps) {
  const past = isPastSlot(slot);
  const isAvailable = !slot.isBooked && !past;

  return (
    <motion.div
      layout={isSelected}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
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
        "flex min-h-[64px] flex-col gap-1.5 rounded-md border p-3 text-left transition-colors select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        past
          ? "cursor-default opacity-40"
          : "cursor-pointer",
        !past && isAvailable && "hover:bg-muted/50",
        !past && !isAvailable && "cursor-not-allowed opacity-60",
        isSelected && isAvailable && cn(accent.tint, "border-primary/40"),
        slot.isOwnBooking && !past && cn(accent.tintStrong, "border-primary/20"),
        isCurrent && !past && "ring-1 ring-inset ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {convertUtcTimeToLocal(slot.startTime)}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            &ndash; {convertUtcTimeToLocal(slot.endTime)}
          </span>
        </span>
        {isSelected && isAvailable && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full",
              accent.solid,
            )}
          >
            <Check className="size-3" aria-hidden="true" />
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {past ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
            <Clock className="size-3" aria-hidden="true" />
            Past
          </span>
        ) : isAvailable ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isSelected ? accent.dotStrong : "bg-muted-foreground/40",
              )}
            />
            {isSelected ? "Selected" : "Available"}
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <Badge
              variant={slot.isOwnBooking ? "default" : "secondary"}
              className={cn(slot.isOwnBooking && cn(accent.solid))}
            >
              {slot.isOwnBooking ? "My booking" : "Booked"}
            </Badge>
            {slot.bookedByName && (
              <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
                <Avatar className="size-5">
                  <AvatarImage src={slot.bookedByImage || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {slot.bookedByName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium">
                  {slot.bookedByName}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}