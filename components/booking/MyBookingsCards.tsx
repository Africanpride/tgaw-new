"use client";

import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventType } from "@prisma/client";
import { CalendarCheck2, Clock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { slotAccent } from "./slotAccent";

interface MyBookingsCardsProps {
  bookings: SlotData[];
  onCancel: (slot: SlotData) => void;
  type: EventType;
}

export function MyBookingsCards({ bookings, onCancel, type }: MyBookingsCardsProps) {
  const accent = slotAccent[type];

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="No bookings for this day"
        description="Claim a slot and keep your devotional watch alive."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const past = isPastSlot(booking);
        return (
          <Card
            key={booking.id}
            className={cn(
              "overflow-hidden border-l-2 transition-all",
              past
                ? "opacity-40 border-l-muted bg-muted/30"
                : accent.rail,
            )}
          >
            <div className="flex items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className={cn("flex items-center gap-1.5 font-semibold tabular-nums", accent.text)}>
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  {convertUtcTimeToLocal(booking.startTime)} –{" "}
                  {convertUtcTimeToLocal(booking.endTime)}
                </p>
                {booking.notes && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {booking.notes}
                  </p>
                )}
                {past && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                      aria-hidden="true"
                    />
                    Past
                  </span>
                )}
              </div>
              {!past && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(booking)}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}