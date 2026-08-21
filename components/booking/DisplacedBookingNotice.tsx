import { CalendarClock } from "lucide-react";
import { convertUtcTimeToLocal } from "./slotTime";
import type { DisplacedBooking } from "@/lib/services/slotEventEnrichment";

interface DisplacedBookingNoticeProps {
  bookings: DisplacedBooking[];
  /** Human noun for the slot type, e.g. "prayer", "Bible reading". */
  slotNoun: string;
}

/**
 * Tells a user their booking was superseded by a Special Event
 * (precedence displacement via eventBlockService).
 */
export function DisplacedBookingNotice({ bookings, slotNoun }: DisplacedBookingNoticeProps) {
  if (bookings.length === 0) return null;

  return (
    <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 p-4 dark:bg-violet-500/20">
      <p className="flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        Superseded by a Special Event
      </p>
      <ul className="mt-2 space-y-1.5">
        {bookings.map((booking) => (
          <li key={booking.id} className="text-sm text-muted-foreground">
            Your{" "}
            <span className="font-medium tabular-nums text-foreground">
              {convertUtcTimeToLocal(booking.startTime)} &ndash;{" "}
              {convertUtcTimeToLocal(booking.endTime)}
            </span>{" "}
            {slotNoun} slot was taken over by{" "}
            <span className="font-medium text-violet-700 dark:text-violet-300">
              &ldquo;{booking.event?.title ?? "a special event"}&rdquo;
            </span>
            .
          </li>
        ))}
      </ul>
    </div>
  );
}
