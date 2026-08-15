"use client";

import { useState } from "react";
import { EventType } from "@prisma/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  initialSlotId?: string;
}

export function SlotBookingStrip({ slots, type, initialSlotId }: SlotBookingStripProps) {
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialIndex = initialSlotId
    ? Math.max(0, slots.findIndex((slot) => slot.id === initialSlotId))
    : 0;

  const accentStyles = {
    BIBLE: { border: "border-purple-500", bg: "bg-purple-500/10" },
    PRAYER: { border: "border-red-500", bg: "bg-red-500/10" },
    PRAISE_WORSHIP: { border: "border-amber-500", bg: "bg-amber-500/10" },
  } as const;
  const accent = accentStyles[type];

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
        <h3 className="font-semibold">Today&apos;s Slots</h3>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href={`/booking?type=${type}`}>
            View Full Calendar <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      {slots.length === 0 ? (
        <div className="text-muted-foreground text-sm rounded-md border p-4">
          No slots available.
        </div>
      ) : (
        <Carousel
          className="w-full"
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            startIndex: initialIndex,
          }}
        >
          <CarouselContent className="-ml-2 px-10">
            {slots.map((slot) => {
              const isAvailable = !slot.isBooked && !isPastSlot(slot);
              const past = isPastSlot(slot);
              const isCurrent = slot.id === initialSlotId;
              return (
                <CarouselItem key={slot.id} className="basis-auto pl-2">
                  <div
                    data-slot-id={slot.id}
                    onClick={() => handleSelect(slot)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-md border transition-colors shrink-0 cursor-pointer",
                      past
                        ? "w-20 h-12 opacity-40 cursor-default"
                        : "w-24 h-16 p-3",
                      !past && isAvailable && "hover:bg-muted/50",
                      !past && !isAvailable && "opacity-50 cursor-not-allowed bg-muted",
                      slot.isOwnBooking && !past && cn(accent.border, accent.bg, "opacity-100"),
                      isCurrent && !past && "ring-2 ring-primary ring-offset-2",
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
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm" />
          <CarouselNext className="right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm" />
        </Carousel>
      )}

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