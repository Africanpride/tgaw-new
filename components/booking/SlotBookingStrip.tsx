"use client";

import { useState } from "react";
import { EventType } from "@prisma/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SlotData, isPastSlot } from "./SlotCell";
import { cn } from "@/lib/utils";
import { SlotBookingSheet } from "./SlotBookingSheet";
import { bookSlotAction } from "@/actions/slotActions";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

interface SlotBookingStripProps {
  slots: SlotData[];
  type: EventType;
}

export function SlotBookingStrip({ slots, type }: SlotBookingStripProps) {
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accentColorClass = type === "BIBLE" ? "purple-500" : type === "PRAYER" ? "red-500" : "amber-500";

  const handleSelect = (slot: SlotData) => {
    if (slot.isBooked || isPastSlot(slot)) return;
    setSelectedSlot(slot);
    setSheetOpen(true);
  };

  const handleConfirm = async (notes: string) => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    
    const result = await bookSlotAction({ slotIds: [selectedSlot.id], notes });
    
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Slot booked successfully");
      setSheetOpen(false);
      setSelectedSlot(null);
    } else {
      toast.error(result.error || "Failed to book slot");
    }
  };

  function convertUtcTimeToLocal(utcTime: string) {
    const [hours, minutes] = utcTime.split(':');
    const d = new Date();
    d.setUTCHours(parseInt(hours, 10));
    d.setUTCMinutes(parseInt(minutes, 10));
    
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Today's Slots</h3>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href={`/booking?type=${type}`}>
            View Full Calendar <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <ScrollArea className="grid grid-cols-1 overflow-x-scroll w-full rounded-md border">
        <div className="flex w-max min-w-full space-x-2 p-4">
          {slots.length === 0 ? (
            <div className="text-muted-foreground text-sm">No slots available.</div>
          ) : (
            slots.map((slot) => {
              const isAvailable = !slot.isBooked && !isPastSlot(slot);
              const past = isPastSlot(slot);
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelect(slot)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md border transition-colors shrink-0",
                    past
                      ? "w-20 h-12 opacity-40 cursor-default"
                      : "w-24 h-16 cursor-pointer p-3",
                    !past && isAvailable && "hover:bg-muted/50",
                    !past && !isAvailable && "opacity-50 cursor-not-allowed bg-muted",
                    slot.isOwnBooking && !past && `border-${accentColorClass} bg-${accentColorClass}/10 opacity-100`
                  )}
                >
                  <span className={cn("font-medium tabular-nums", past ? "text-xs" : "text-sm")}>
                    {convertUtcTimeToLocal(slot.startTime)}
                  </span>
                  <span className={cn("text-muted-foreground", past ? "text-[10px] mt-0.5 flex items-center gap-0.5" : "text-xs mt-1")}>
                    {past ? (
                      <>
                        <Clock className="size-2.5" aria-hidden="true" />
                        Past
                      </>
                    ) : slot.isOwnBooking ? "Mine" : isAvailable ? "Available" : "Booked"}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <SlotBookingSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen}
        selectedSlots={selectedSlot ? [selectedSlot] : []}
        type={type}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
