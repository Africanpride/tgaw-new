"use client";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { slotAccent } from "./slotAccent";
import { EventType } from "@prisma/client";

interface BookingCalendarMiniProps {
  date: Date;
  onDateChange: (date: Date | undefined) => void;
  bookedDates?: Set<string>;
  myBookedDates?: Set<string>;
  type: EventType;
}

export function BookingCalendarMini({
  date,
  onDateChange,
  bookedDates = new Set(),
  myBookedDates = new Set(),
  type,
}: BookingCalendarMiniProps) {
  const accent = slotAccent[type];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pick a day</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          className="w-full rounded-md"
          classNames={{
            root: "w-full rdp-root",
          }}
          components={{
            DayButton: (props) => {
              const dateKey = format(props.day.date, "yyyy-MM-dd");
              const hasBooking = bookedDates.has(dateKey);
              const hasOwn = myBookedDates.has(dateKey);
              return (
                <CalendarDayButton {...props}>
                  {props.children}
                  {hasBooking && (
                    <span
                      className={cn(
                        "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                        hasOwn ? accent.dotStrong : accent.dot,
                      )}
                    />
                  )}
                </CalendarDayButton>
              );
            },
          }}
        />
      </CardContent>
    </Card>
  );
}