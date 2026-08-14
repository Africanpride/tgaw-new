"use client";

import { SlotData, convertUtcTimeToLocal } from "./SlotCell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventType } from "@prisma/client";
import { CalendarCheck2, Clock } from "lucide-react";
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
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <div className={cn("flex size-10 items-center justify-center rounded-full", accent.iconTile)}>
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">No bookings for this day</p>
          <p className="text-sm text-muted-foreground">
            Claim a slot and keep your devotional watch alive.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id} className={cn("overflow-hidden border-l-2", accent.rail)}>
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className={cn("flex items-center gap-1.5 font-semibold tabular-nums", accent.text)}>
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {convertUtcTimeToLocal(booking.startTime)} – {convertUtcTimeToLocal(booking.endTime)}
              </p>
              {booking.notes && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{booking.notes}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking)}
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}