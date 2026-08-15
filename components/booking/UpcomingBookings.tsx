"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convertUtcTimeToLocal } from "./SlotCell";
import { cn } from "@/lib/utils";

interface UpcomingBookingEvent {
  type: string;
  title: string;
  date: string;
  time: string;
  duration: number;
}

interface UpcomingBooking {
  id: string;
  event: UpcomingBookingEvent;
}

interface UpcomingBookingsProps {
  bookings: UpcomingBooking[];
}

const typeColors: Record<string, string> = {
  BIBLE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PRAYER: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  PRAISE_WORSHIP:
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
};

function toDateKey(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const bookedDates = useMemo(
    () =>
      Array.from(
        new Set(bookings.map((b) => b.event.date).filter(Boolean)),
      ).map((dateStr) => new Date(`${dateStr}T00:00:00`)),
    [bookings],
  );

  const selectedDateKey = date ? toDateKey(date) : null;

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.event.date === selectedDateKey)
        .sort((a, b) => a.event.time.localeCompare(b.event.time)),
    [bookings, selectedDateKey],
  );

  const selectedLabel = date
    ? date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Select a day";

  return (
    <div className="flex flex-col overflow-hidden rounded-md border bg-background sm:flex-row sm:divide-x">
      <div className="sm:shrink-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={{ hasBooking: bookedDates }}
          modifiersClassNames={{
            hasBooking:
              "after:absolute after:inset-x-0 after:bottom-1 after:mx-auto after:size-1 after:rounded-full after:bg-primary",
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:w-72">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Upcoming Bookings</span>
            <span className="text-xs text-muted-foreground">{selectedLabel}</span>
          </div>
        </div>
        <ScrollArea className="h-64 max-h-64 sm:flex-1 sm:h-auto">
          <div className="flex flex-col gap-2 p-4">
            {dayBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings on this day.
              </p>
            ) : (
              dayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
                      <Clock
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {convertUtcTimeToLocal(booking.event.time)}
                      <span className="text-xs font-normal text-muted-foreground">
                        &middot; {booking.event.duration} min
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {booking.event.title}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("shrink-0 text-xs", typeColors[booking.event.type] ?? "")}
                  >
                    {booking.event.type.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}