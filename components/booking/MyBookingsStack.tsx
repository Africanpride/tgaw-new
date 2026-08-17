"use client";

import { useState } from "react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle2, Clock, CalendarCheck2 } from "lucide-react";
import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import { slotAccent } from "./slotAccent";
import { cn } from "@/lib/utils";
import { EventType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

const SPRING_TRANSITION = {
  type: "spring" as const,
  damping: 15,
  stiffness: 200,
  mass: 1,
  bounce: 0.3,
  delay: 0.13,
};

const createVariant = (
  openProps: Record<string, number | string>,
  closeProps: Record<string, number | string>,
  transition = SPRING_TRANSITION
): Variants => ({
  open: { ...openProps, transition },
  close: { ...closeProps, transition },
});

const popup1Variant = createVariant({ y: -55 }, { y: 0 });
const popup2Variant = createVariant({ y: 0, scale: 1 }, { y: 0, scale: 0.95 });
const popup3Variant = createVariant({ y: 55, scale: 1 }, { y: 0, scale: 0.9 });
const buttonVariant = createVariant({ y: 55 }, { y: 0 });
const iconVariant = createVariant(
  { rotate: 180 },
  { rotate: 0 },
  { ...SPRING_TRANSITION, damping: 12, stiffness: 150 }
);

const CARD_CONFIGS = [
  { variant: popup3Variant, top: 100 },
  { variant: popup2Variant, top: 90 },
  { variant: popup1Variant, top: 80 },
];

function getTypeLabel(type: EventType | undefined): string {
  if (!type) return "Session";
  return type === "BIBLE" ? "Bible Reading" : type === "PRAYER" ? "Prayer" : "Praise & Worship";
}

interface MyBookingsStackProps {
  bookings: SlotData[];
  onCancel: (slot: SlotData) => void;
  dateLabel: string;
}

export function MyBookingsStack({ bookings, onCancel, dateLabel }: MyBookingsStackProps) {
  const upcomingBookings = bookings.filter((b) => !isPastSlot(b));
  const pastBookings = bookings.filter(isPastSlot);

  const [isOpen, setIsOpen] = useState(false);

  if (bookings.length === 0) {
    return (
      <Card className="w-full h-72">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center h-full">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <CalendarCheck2 className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No bookings for {dateLabel}</p>
          <p className="text-sm text-muted-foreground">
            Claim a slot and keep your devotional watch alive.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upcoming bookings - shown as regular cards */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-3">
          {upcomingBookings.map((booking) => {
            const type = booking.type as EventType | undefined;
            const accent = type ? slotAccent[type] : slotAccent.BIBLE;
            const typeLabel = getTypeLabel(type);

            return (
              <Card key={booking.id} className={cn("overflow-hidden border-l-2", accent.rail)}>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className={cn("flex items-center gap-1.5 font-semibold tabular-nums", accent.text)}>
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                      {typeLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                      {convertUtcTimeToLocal(booking.startTime)} –{" "}
                      {convertUtcTimeToLocal(booking.endTime)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                    onClick={() => onCancel(booking)}
                  >
                    <span className="sr-only">Cancel booking</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past bookings stack */}
      {pastBookings.length > 0 && (
        <div className="relative w-full h-72 overflow-hidden rounded-xl px-3.5 py-2.5">
          <div className="relative h-full w-full">
            {pastBookings.slice(0, 3).map((booking, idx) => {
              const config = CARD_CONFIGS[idx] || CARD_CONFIGS[CARD_CONFIGS.length - 1];
              const type = booking.type as EventType | undefined;
              const typeLabel = getTypeLabel(type);

              return (
                <motion.div
                  key={booking.id}
                  variants={config.variant}
                  animate={isOpen ? "open" : "close"}
                  initial="close"
                  style={{ top: config.top }}
                  className={cn(
                    "absolute inset-x-0 mx-auto",
                    "flex h-14 w-full items-center justify-between",
                    "bg-background rounded-xl border border-border px-2",
                    "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", "bg-muted")}>
                      <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col justify-center gap-0.5 min-w-0">
                      <p className="text-sm font-semibold truncate text-muted-foreground">{typeLabel}</p>
                      <p className="text-muted-foreground text-xs truncate">
                        {convertUtcTimeToLocal(booking.startTime)} – {convertUtcTimeToLocal(booking.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                      Past
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {pastBookings.length > 3 && (
              <motion.div
                variants={buttonVariant}
                animate={isOpen ? "open" : "close"}
                initial="close"
                style={{ top: 168 }}
                className="absolute inset-x-0 mx-auto z-10 w-full max-w-24"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="w-full h-8 rounded-lg flex items-center justify-between gap-1 px-2.5"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isOpen ? "hide" : "show"}
                      className="text-xs font-medium text-foreground/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isOpen ? "Hide" : `+${pastBookings.length - 3} more`}
                    </motion.span>
                  </AnimatePresence>

                  <motion.span
                    variants={iconVariant}
                    animate={isOpen ? "open" : "close"}
                    initial="close"
                    className="text-foreground/80 flex items-center"
                  >
                    <ChevronDown className="size-4" />
                  </motion.span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}