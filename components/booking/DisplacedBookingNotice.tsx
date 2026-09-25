"use client";

import { CalendarClock } from "lucide-react";
import { convertUtcTimeToLocal } from "./slotTime";
import type { DisplacedBooking } from "@/lib/services/slotEventEnrichment";
import { useTranslation, Trans } from "react-i18next";

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
  const { t } = useTranslation("booking");
  if (bookings.length === 0) return null;

  return (
    <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 p-2 sm:p-4 dark:bg-violet-500/20">
      <p className="flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        {t("displaced.title")}
      </p>
      <ul className="mt-2 space-y-1.5">
        {bookings.map((booking) => (
          <li key={booking.id} className="text-sm text-muted-foreground">
            <Trans
              i18nKey="displaced.row"
              ns="booking"
              values={{
                range: `${convertUtcTimeToLocal(booking.startTime)} – ${convertUtcTimeToLocal(booking.endTime)}`,
                noun: slotNoun,
                title: booking.event?.title ?? t("displaced.fallbackEvent"),
              }}
              components={{
                hl: <span className="font-medium tabular-nums text-foreground" />,
                ev: <span className="font-medium text-violet-700 dark:text-violet-300" />,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
