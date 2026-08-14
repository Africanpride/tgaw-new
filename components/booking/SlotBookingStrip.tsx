"use client";

import { useState } from "react";
import { EventType } from "@prisma/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SlotData } from "./SlotCell";
import { cn } from "@/lib/utils";
import { SlotBookingSheet } from "./SlotBookingSheet";
import { bookSlotAction } from "@/actions/slotActions";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    if (slot.isBooked) return;
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
      
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max space-x-2 p-4">
          {slots.length === 0 ? (
            <div className="text-muted-foreground text-sm">No slots available.</div>
          ) : (
            slots.map((slot) => {
              const isAvailable = !slot.isBooked;
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelect(slot)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 w-24 h-16 rounded-md border cursor-pointer transition-colors shrink-0",
                    isAvailable ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed bg-muted",
                    slot.isOwnBooking && `border-${accentColorClass} bg-${accentColorClass}/10 opacity-100`
                  )}
                >
                  <span className="text-sm font-medium">{convertUtcTimeToLocal(slot.startTime)}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {slot.isOwnBooking ? "Mine" : isAvailable ? "Available" : "Booked"}
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
