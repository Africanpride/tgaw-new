"use client";

import { useState } from "react";
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
import { BookOpen, HandHeart, Music, CalendarDays, Clock } from "lucide-react";
import { SlotData } from "./SlotCell";
import { slotAccent } from "./slotAccent";
import { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SlotBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlots: SlotData[];
  type: EventType;
  onConfirm: (notes: string) => Promise<void>;
  isSubmitting: boolean;
}

const TYPE_ICON: Record<EventType, typeof BookOpen> = {
  BIBLE: BookOpen,
  PRAYER: HandHeart,
  PRAISE_WORSHIP: Music,
};

const TYPE_LABEL: Record<EventType, string> = {
  BIBLE: "Bible Reading",
  PRAYER: "Prayer",
  PRAISE_WORSHIP: "Praise & Worship",
};

function convertUtcTimeToLocal(utcTime: string) {
  const [hours, minutes] = utcTime.split(":");
  const d = new Date();
  d.setUTCHours(parseInt(hours, 10));
  d.setUTCMinutes(parseInt(minutes, 10));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SlotBookingSheet({
  open,
  onOpenChange,
  selectedSlots,
  type,
  onConfirm,
  isSubmitting,
}: SlotBookingSheetProps) {
  const [notes, setNotes] = useState("");

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
    await onConfirm(notes);
    setNotes("");
  };

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
