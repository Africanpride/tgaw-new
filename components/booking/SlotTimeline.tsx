"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarX2, ChevronDown } from "lucide-react";
import { SlotCell, SlotData } from "./SlotCell";
import { isPastSlot, isCurrentSlot } from "./slotTime";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { slotAccent } from "./slotAccent";
import { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE = 8;

interface SlotTimelineProps {
  slots: SlotData[];
  type: EventType;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEmptyAction?: () => void;
}

export function SlotTimeline({
  slots,
  type,
  selectedIds,
  onSelectionChange,
  onEmptyAction,
}: SlotTimelineProps) {
  const visibleSlots = useMemo(
    () => slots.filter((s) => !isPastSlot(s) || isCurrentSlot(s)),
    [slots],
  );
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const accent = slotAccent[type];

  const shownSlots = expanded ? visibleSlots : visibleSlots.slice(0, INITIAL_VISIBLE);

  useEffect(() => {
    if (!scrollRef.current) return;
    const current = visibleSlots.find((s) => isCurrentSlot(s));
    if (!current) return;
    const el = scrollRef.current.querySelector(`[data-slot-id="${current.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [visibleSlots]);

  const handleSelect = (id: string, shiftKey: boolean) => {
    const targetSlot = visibleSlots.find((s) => s.id === id);
    const isBlocked = !!targetSlot?.eventId;
    if (!targetSlot || targetSlot.isBooked || isPastSlot(targetSlot) || isBlocked) return;

    if (shiftKey && lastSelectedId) {
      const startIndex = visibleSlots.findIndex((s) => s.id === lastSelectedId);
      const endIndex = visibleSlots.findIndex((s) => s.id === id);
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      const newSelection: string[] = [];
      let canSelectAll = true;
      for (let i = min; i <= max; i++) {
        const slotIsBlocked = !!visibleSlots[i].eventId;
        if (visibleSlots[i].isBooked || isPastSlot(visibleSlots[i]) || slotIsBlocked) {
          canSelectAll = false;
          break;
        }
        newSelection.push(visibleSlots[i].id);
      }
      if (canSelectAll) {
        onSelectionChange(Array.from(new Set([...selectedIds, ...newSelection])));
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

  if (visibleSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border py-14 text-center">
        <div className={cn("flex size-12 items-center justify-center rounded-full", accent.iconTile)}>
          <CalendarX2 className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium">No slots for this day</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          This day is quiet. Pick another day on the calendar to keep your devotional watch.
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
      <div ref={scrollRef} className="flex flex-col">
        {shownSlots.map((slot) => (
          <SlotCell
            key={slot.id}
            slot={slot}
            isSelected={selectedIds.includes(slot.id)}
            onSelect={handleSelect}
            accent={accent}
            isCurrent={isCurrentSlot(slot)}
          />
        ))}
        {!expanded && visibleSlots.length > INITIAL_VISIBLE && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border-t bg-muted/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Show {visibleSlots.length - INITIAL_VISIBLE} more slots
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </ScrollArea>
  );
}