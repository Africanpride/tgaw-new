"use client";

import { SlotData } from "./SlotCell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventType } from "@prisma/client";

interface MyBookingsCardsProps {
  bookings: SlotData[];
  onCancel: (slotId: string) => void;
  type: EventType;
}

export function MyBookingsCards({ bookings, onCancel, type }: MyBookingsCardsProps) {
  const accentColorClass = type === "BIBLE" ? "text-purple-500" : type === "PRAYER" ? "text-red-500" : "text-amber-500";
  
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          You have no upcoming bookings for this date.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map(booking => (
        <Card key={booking.id} className="overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <div>
              <p className={`font-semibold ${accentColorClass}`}>
                {booking.startTime} - {booking.endTime}
              </p>
              {booking.notes && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{booking.notes}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => onCancel(booking.id)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
              Cancel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
