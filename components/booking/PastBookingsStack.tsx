"use client";

import { useState } from "react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle2, Clock } from "lucide-react";
import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import { slotAccent } from "./slotAccent";
import { cn } from "@/lib/utils";
import { EventType } from "@prisma/client";

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

export function PastBookingsStack({ bookings }: { bookings: SlotData[] }) {
  const pastBookings = bookings.filter(isPastSlot).slice(0, 3);
  const remainingCount = bookings.filter(isPastSlot).length - 3;

  const [isOpen, setIsOpen] = useState(false);

  if (pastBookings.length === 0) return null;

  return (
    <div className="relative w-full max-w-xs h-72 overflow-hidden rounded-xl px-3.5 py-2.5">
      <div className="relative h-full w-full">
        {pastBookings.map((booking, idx) => {
          const config = CARD_CONFIGS[idx] || CARD_CONFIGS[CARD_CONFIGS.length - 1];
          const type = booking.type as EventType | undefined;
          const accent = type ? slotAccent[type] : slotAccent.BIBLE;
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
                "flex h-14 w-full max-w-xs items-center justify-between",
                "bg-background rounded-xl border border-border px-2"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accent.tint)}>
                  <CheckCircle2 className={cn("size-5", accent.text)} aria-hidden="true" />
                </span>
                <div className="flex flex-col justify-center gap-0.5 min-w-0">
                  <p className="text-foreground text-sm font-semibold truncate">{typeLabel}</p>
                  <p className="text-muted-foreground text-xs truncate">
                    {convertUtcTimeToLocal(booking.startTime)} – {convertUtcTimeToLocal(booking.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="size-3" aria-hidden="true" />
                {booking.date ? format(parseISO(booking.date), "MMM d") : "Past"}
              </div>
            </motion.div>
          );
        })}

        {remainingCount > 0 && (
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
                  {isOpen ? "Hide" : `+${remainingCount} more`}
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
  );
}

// Need to import parseISO and format
import { parseISO, format } from "date-fns";