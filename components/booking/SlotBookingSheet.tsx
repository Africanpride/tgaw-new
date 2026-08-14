"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SlotData } from "./SlotCell";
import { EventType } from "@prisma/client";

interface SlotBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlots: SlotData[];
  type: EventType;
  onConfirm: (notes: string) => Promise<void>;
  isSubmitting: boolean;
}

export function SlotBookingSheet({ open, onOpenChange, selectedSlots, type, onConfirm, isSubmitting }: SlotBookingSheetProps) {
  const [notes, setNotes] = useState("");

  if (selectedSlots.length === 0) return null;

  const startTime = selectedSlots[0].startTime;
  const endTime = selectedSlots[selectedSlots.length - 1].endTime;

  const handleConfirm = async () => {
    await onConfirm(notes);
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-xl sm:rounded-xl sm:side-right sm:bottom-auto">
        <SheetHeader>
          <SheetTitle>Confirm Booking</SheetTitle>
          <SheetDescription>
            You are booking a {type.replace('_', ' ').toLowerCase()} slot from {startTime} to {endTime}.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="space-y-2">
            <Label htmlFor="notes">
              {type === "BIBLE" && "What passage will you read? (Optional)"}
              {type === "PRAYER" && "Prayer focus (Optional)"}
              {type === "PRAISE_WORSHIP" && "Worship theme (Optional)"}
            </Label>
            <Textarea
              id="notes"
              placeholder="Add optional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
