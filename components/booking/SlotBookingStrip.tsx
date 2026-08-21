"use client";

import { useState } from "react";
import type { BookableType } from "@/lib/services/slotService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import { cn } from "@/lib/utils";
import { SlotBookingSheet } from "./SlotBookingSheet";
import { bookSlotAction } from "@/actions/slotActions";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, CalendarClock, Check, Clock } from "lucide-react";
import { slotAccent, EVENT_BLOCK } from "./slotAccent";
import { EventBlockPopover } from "./EventBlockPopover";

interface SlotBookingStripProps {
  slots: SlotData[];
  type: BookableType;
  initialSlotId?: string;
}

export function SlotBookingStrip({ slots, type, initialSlotId }: SlotBookingStripProps) {
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialIndex = initialSlotId
    ? Math.max(0, slots.findIndex((slot) => slot.id === initialSlotId))
    : 0;

  const accent = slotAccent[type];

  const handleSelect = (slot: SlotData) => {
    if (slot.isBooked || isPastSlot(slot) || slot.eventId) return;
    setSelectedSlot(slot);
    setSheetOpen(true);
  };

  const handleConfirm = async (notes: string): Promise<boolean> => {
    if (!selectedSlot) return false;
    setIsSubmitting(true);
    
    const result = await bookSlotAction({ slotIds: [selectedSlot.id], notes });
    
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Slot booked successfully");
      setSelectedSlot(null);
      return true;
    } else {
      toast.error(result.error || "Failed to book slot");
      return false;
    }
  };

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
              const past = isPastSlot(slot);
              const blocked = !!slot.eventId;
              const isAvailable = !slot.isBooked && !past && !blocked;
              const isCurrent = slot.id === initialSlotId;

              const cell = (
                <div
                  data-slot-id={slot.id}
                  onClick={() => handleSelect(slot)}
                  role="button"
                  tabIndex={isAvailable ? 0 : undefined}
                  aria-disabled={!isAvailable}
                  aria-label={`${convertUtcTimeToLocal(slot.startTime)} slot, ${
                    past
                      ? "past"
                      : blocked
                        ? `reserved for special event${slot.event ? ` ${slot.event.title}` : ""}`
                        : isAvailable
                          ? "available"
                          : slot.isOwnBooking
                            ? "your booking"
                            : "booked"
                  }${isCurrent ? " (current)" : ""}`}
                  onKeyDown={(e) => {
                    if (isAvailable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSelect(slot);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border transition-all duration-200 shrink-0 select-none",
                    past
                      ? "w-20 h-14 opacity-40 cursor-default bg-muted/30 border-dashed"
                      : "w-24 h-16 p-3 shadow-2xs cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    !past && blocked && cn("cursor-not-allowed", EVENT_BLOCK.tint, EVENT_BLOCK.border),
                    !past && isAvailable && accent.available,
                    !past && slot.isBooked && !slot.isOwnBooking && cn(accent.booked, "cursor-not-allowed opacity-80"),
                    !past && slot.isOwnBooking && cn(accent.mine, "opacity-100 font-semibold"),
                    isCurrent && !past && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  <span className={cn("font-medium tabular-nums", past ? "text-xs text-muted-foreground" : "text-sm")}>
                    {convertUtcTimeToLocal(slot.startTime)}
                  </span>
                  <span className={cn(
                    "text-xs mt-1 flex items-center gap-1 font-medium",
                    past ? "text-[10px] text-muted-foreground/70" :
                    blocked ? EVENT_BLOCK.text :
                    slot.isOwnBooking ? accent.text :
                    slot.isBooked ? "text-muted-foreground" :
                    "text-muted-foreground/80"
                  )}>
                    {past ? (
                      <>
                        <Clock className="size-2.5" aria-hidden="true" />
                        Past
                      </>
                    ) : blocked ? (
                      <>
                        <CalendarClock className="size-3" aria-hidden="true" />
                        Event
                      </>
                    ) : slot.isOwnBooking ? (
                      <>
                        <Check className="size-3 text-emerald-500" aria-hidden="true" />
                        Mine
                      </>
                    ) : isAvailable ? (
                      "Available"
                    ) : (
                      "Booked"
                    )}
                  </span>
                </div>
              );

              return (
                <CarouselItem key={slot.id} className="basis-auto pl-2">
                  {!past && blocked && slot.event ? (
                    <EventBlockPopover event={slot.event}>{cell}</EventBlockPopover>
                  ) : (
                    cell
                  )}
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