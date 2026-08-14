"use client";

import { useState } from "react";
import { SlotCell, SlotData } from "./SlotCell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventType } from "@prisma/client";

interface SlotTimelineProps {
  slots: SlotData[];
  type: EventType;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function SlotTimeline({ slots, type, selectedIds, onSelectionChange }: SlotTimelineProps) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const accentColorClass = type === "BIBLE" ? "purple-500" : type === "PRAYER" ? "red-500" : "amber-500";

  const handleSelect = (id: string, shiftKey: boolean) => {
    const targetSlot = slots.find(s => s.id === id);
    if (!targetSlot || targetSlot.isBooked) return;

    if (shiftKey && lastSelectedId) {
      const startIndex = slots.findIndex(s => s.id === lastSelectedId);
      const endIndex = slots.findIndex(s => s.id === id);
      
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      
      const newSelection = [];
      let canSelectAll = true;

      for (let i = min; i <= max; i++) {
        if (slots[i].isBooked) {
          canSelectAll = false;
          break;
        }
        newSelection.push(slots[i].id);
      }

      if (canSelectAll) {
        onSelectionChange(Array.from(new Set([...selectedIds, ...newSelection])));
      }
    } else {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter(sId => sId !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
      setLastSelectedId(id);
    }
  };

  return (
    <ScrollArea className="h-[500px] w-full rounded-md border">
      <div className="flex flex-col">
        {slots.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No slots available.</div>
        ) : (
          slots.map((slot) => (
            <SlotCell
              key={slot.id}
              slot={slot}
              isSelected={selectedIds.includes(slot.id)}
              onSelect={handleSelect}
              accentColorClass={accentColorClass}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
