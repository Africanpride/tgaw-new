"use client";

import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarMiniProps {
  date: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function BookingCalendarMini({ date, onDateChange }: BookingCalendarMiniProps) {
  return (
    <div className="rounded-md border p-3 flex justify-center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={onDateChange}
        className="rounded-md"
      />
    </div>
  );
}
