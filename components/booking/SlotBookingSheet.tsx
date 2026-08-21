"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Check,
  HandHeart,
  Music,
  CalendarDays,
  Clock,
} from "lucide-react";
import { SlotData } from "./SlotCell";
import { slotAccent } from "./slotAccent";
import type { BookableType } from "@/lib/services/slotService";
import { cn } from "@/lib/utils";

interface SlotBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlots: SlotData[];
  type: BookableType;
  onConfirm: (notes: string) => Promise<boolean>;
  isSubmitting: boolean;
}

const TYPE_ICON: Record<BookableType, typeof BookOpen> = {
  BIBLE: BookOpen,
  PRAYER: HandHeart,
  PRAISE_WORSHIP: Music,
};

const TYPE_LABEL: Record<BookableType, string> = {
  BIBLE: "Bible Reading",
  PRAYER: "Prayer",
  PRAISE_WORSHIP: "Praise & Worship",
};

import { convertUtcTimeToLocal } from "./slotTime";

export function SlotBookingSheet({
  open,
  onOpenChange,
  selectedSlots,
  type,
  onConfirm,
  isSubmitting,
}: SlotBookingSheetProps) {
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  if (selectedSlots.length === 0) return null;

  const accent = slotAccent[type];
  const TypeIcon = TYPE_ICON[type];
  const first = selectedSlots[0];
  const last = selectedSlots[selectedSlots.length - 1];
  const startLocal = convertUtcTimeToLocal(first.startTime);
  const endLocal = convertUtcTimeToLocal(last.endTime);
  const durationMins = selectedSlots.length * 30;

  const notesLabel =
    type === "BIBLE"
      ? "What passage will you read? (optional)"
      : type === "PRAYER"
        ? "Prayer focus (optional)"
        : "Worship theme (optional)";

  const handleConfirm = async () => {
    const ok = await onConfirm(notes);
    if (ok) {
      setSuccess(true);
      setNotes("");
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1200);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "flex size-16 items-center justify-center rounded-full text-white",
                accent.solid,
              )}
            >
              <Check className="size-8" aria-hidden="true" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-lg font-semibold">Your slot is confirmed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                See you at the altar. The meeting link is ready in your
                dashboard.
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className={cn("border-b p-6 pb-5", accent.tintStrong)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                accent.iconTile,
              )}
            >
              <TypeIcon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg leading-tight">
                Confirm your {TYPE_LABEL[type].toLowerCase()} slot
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 text-sm">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                <span>
                  {first.date
                    ? new Date(`${first.date}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    : "Today"}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn("text-xl font-semibold tabular-nums", accent.text)}>
                  {startLocal} – {endLocal}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {durationMins} minutes · local time
                </p>
              </div>
              <Badge variant="outline" className={accent.text}>
                {TYPE_LABEL[type]}
              </Badge>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="booking-notes">{notesLabel}</Label>
            <Textarea
              id="booking-notes"
              placeholder="Add optional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-6 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn("min-w-32", accent.solid)}
          >
            {isSubmitting ? "Booking…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}