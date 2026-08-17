"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Search,
  SlidersHorizontal,
  UserPlus,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import type { SlotAccent } from "./slotAccent";
import { slotAccent } from "./slotAccent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlotRow {
  id: string;
  type: "BIBLE" | "PRAYER" | "PRAISE_WORSHIP";
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isOwnBooking: boolean;
  bookedByName: string | null;
  bookedByImage: string | null;
  notes: string | null;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

type ViewState = "calendar" | "slots";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  BIBLE: "Bible",
  PRAYER: "Prayer",
  PRAISE_WORSHIP: "Worship",
};

function getAccent(type: string): SlotAccent {
  return slotAccent[type as keyof typeof slotAccent] ?? slotAccent.BIBLE;
}

function formatSelectedDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// UserSearchCombobox
// ---------------------------------------------------------------------------

function UserSearchCombobox({
  value,
  onSelect,
}: {
  value: SearchUser | null;
  onSelect: (u: SearchUser | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/users/search?q=${encodeURIComponent(q.trim())}`,
        );
        const data = await res.json();
        if (data.success) setResults(data.data);
      } catch {
        /* swallow */
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Search for a user"
          className="w-full justify-start gap-2 font-normal"
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="size-5">
                <AvatarImage src={value.image || undefined} />
                <AvatarFallback className="text-[9px]">
                  {value.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {value.name}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="size-3.5" aria-hidden="true" />
              Search user…
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            className="w-full"
            placeholder="Type a name or email…"
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              search(v);
            }}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query.length > 0 && results.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            <CommandGroup>
              {results.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.id}
                  onSelect={() => {
                    onSelect(u);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-2"
                >
                  <Avatar className="size-6">
                    <AvatarImage src={u.image || undefined} />
                    <AvatarFallback className="text-[9px]">
                      {u.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// OverrideDialog
// ---------------------------------------------------------------------------

function OverrideDialogContent({
  slot,
  onOpenChange,
  onSuccess,
}: {
  slot: SlotRow;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  // Initial values come from props at mount time — no useEffect needed.
  // The parent keys this component by slot.id so it remounts for each new slot.
  const [targetUser, setTargetUser] = useState<SearchUser | null>(null);
  const [notes, setNotes] = useState(slot.notes ?? "");
  const [saving, setSaving] = useState(false);


  const handleAssign = async () => {
    if (!slot || !targetUser) {
      toast.error("Please select a target user");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/slots/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          userId: targetUser.id,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Slot ${slot.isBooked ? "overridden" : "assigned"} successfully`,
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.error?.message || data.error || "Failed to assign slot");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleForceCancel = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/slots/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          reason: notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Slot cancelled successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(
          data.error?.message || data.error || "Failed to cancel slot",
        );
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };


  const accent = getAccent(slot.type);
  const typeLabel = TYPE_LABELS[slot.type] ?? slot.type;

  return (
    <>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="size-4" aria-hidden="true" />
            {slot.isBooked ? "Override Slot" : "Assign Slot"}
          </DialogTitle>
          <DialogDescription>
            {convertUtcTimeToLocal(slot.startTime)} –{" "}
            {convertUtcTimeToLocal(slot.endTime)} on{" "}
            {slot.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Slot info */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("border font-medium", accent.text)}
            >
              {typeLabel}
            </Badge>
            {slot.isBooked && slot.bookedByName && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Currently:
                <Avatar className="size-5">
                  <AvatarImage src={slot.bookedByImage || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {slot.bookedByName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {slot.bookedByName}
                </span>
              </span>
            )}
          </div>

          <Separator />

          {/* Target user */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {slot.isBooked ? "Reassign to" : "Assign to"}
            </label>
            <UserSearchCombobox value={targetUser} onSelect={setTargetUser} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              placeholder="Optional context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {slot.isBooked && (
            <Button
              variant="outline"
              onClick={handleForceCancel}
              disabled={saving}
              className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="size-4" aria-hidden="true" />
              )}
              Force Cancel
            </Button>
          )}
          <Button onClick={handleAssign} disabled={saving || !targetUser}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="size-4" aria-hidden="true" />
            )}
            {slot.isBooked ? "Override" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
}

function OverrideDialog({
  slot,
  open,
  onOpenChange,
  onSuccess,
}: {
  slot: SlotRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  if (!slot) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <OverrideDialogContent
        key={slot.id}
        slot={slot}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// AdminSlotRow
// ---------------------------------------------------------------------------

function AdminSlotRow({
  slot,
  onAction,
}: {
  slot: SlotRow;
  onAction: (slot: SlotRow) => void;
}) {
  const accent = getAccent(slot.type);
  const typeLabel = TYPE_LABELS[slot.type] ?? slot.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        "flex items-center gap-3 border-b border-l-4 px-3 py-2.5 transition-colors last:border-b-0",
        accent.rail,
        slot.isBooked ? "bg-muted/30" : "bg-background",
      )}
    >
      {/* Time */}
      <span className="w-[5.5rem] shrink-0 text-sm font-medium tabular-nums">
        {convertUtcTimeToLocal(slot.startTime)}
        <span className="text-muted-foreground"> – </span>
        {convertUtcTimeToLocal(slot.endTime)}
      </span>

      {/* Type badge */}
      <Badge
        variant="outline"
        className={cn("shrink-0 border text-[11px] font-medium", accent.text)}
      >
        {typeLabel}
      </Badge>

      {/* Booker info */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {slot.isBooked ? (
          <>
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={slot.bookedByImage || undefined} />
              <AvatarFallback className="text-[9px]">
                {(slot.bookedByName || "Member").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {slot.bookedByName || "Member"}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Available</span>
        )}
      </div>

      {/* Action button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAction(slot)}
        className="h-7 shrink-0 gap-1 px-2.5 text-xs"
      >
        {slot.isBooked ? (
          <>
            <SlidersHorizontal className="size-3" aria-hidden="true" />
            Override
          </>
        ) : (
          <>
            <UserPlus className="size-3" aria-hidden="true" />
            Assign
          </>
        )}
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AdminSlotOverride (main)
// ---------------------------------------------------------------------------

export function AdminSlotOverride() {
  const [view, setView] = useState<ViewState>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotRow | null>(null);

  // Fetch slots for the selected date
  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/slots?date=${date}`);
      const data = await res.json();
      if (data.success) {
        // Only show booked slots + a handful of available ones for context
        setSlots(data.data.slots ?? []);
      } else {
        toast.error("Failed to load slots");
      }
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setSelectedDate(date);
      if (date) {
        const ds = toDateString(date);
        setView("slots");
        fetchSlots(ds);
      }
    },
    [fetchSlots],
  );

  const handleBack = useCallback(() => {
    setView("calendar");
    setSlots([]);
  }, []);

  const handleSlotAction = useCallback((slot: SlotRow) => {
    setActiveSlot(slot);
    setDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    if (selectedDate) fetchSlots(toDateString(selectedDate));
  }, [selectedDate, fetchSlots]);

  // Separate booked and available slots (excluding past slots)
  const upcomingSlots = slots.filter((s) => !isPastSlot(s));
  const bookedSlots = upcomingSlots.filter((s) => s.isBooked);
  const availableSlots = upcomingSlots.filter((s) => !s.isBooked);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <SlidersHorizontal
                className="size-4 text-primary"
                aria-hidden="true"
              />
            </div>
            Slot Override
          </CardTitle>
          <CardDescription>
            Pick a date to view and override bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <AnimatePresence mode="wait" initial={false}>
            {view === "calendar" ? (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  showOutsideDays={false}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="w-full [--cell-size:--spacing(10)]"
                  classNames={{
                    root: "w-full",
                    months: "w-full",
                    month: "w-full",
                  }}
                  components={{
                    DayButton: ({ children, modifiers, day, ...props }) => {
                      return (
                        <CalendarDayButton
                          day={day}
                          modifiers={modifiers}
                          {...props}
                        >
                          <span className="text-xs font-medium leading-none">
                            {children}
                          </span>
                        </CalendarDayButton>
                      );
                    },
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="slots-view"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {/* Header row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={handleBack}
                    aria-label="Back to calendar"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {selectedDate && formatSelectedDate(selectedDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookedSlots.length} booked · {availableSlots.length}{" "}
                      available
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Slot list */}
                {loading ? (
                  <div className="space-y-2 py-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-7 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CalendarCheck className="size-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No slots on this date
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Slots may need to be generated first.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto overscroll-contain rounded-md">
                    {/* Booked slots first */}
                    {bookedSlots.length > 0 && (
                      <div>
                        <p className="sticky top-0 z-10 mb-1 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Booked ({bookedSlots.length})
                        </p>
                        <AnimatePresence>
                          {bookedSlots.map((s) => (
                            <AdminSlotRow
                              key={s.id}
                              slot={s}
                              onAction={handleSlotAction}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Available slots */}
                    {availableSlots.length > 0 && (
                      <div className="mt-3">
                        <p className="sticky top-0 z-10 mb-1 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Available ({availableSlots.length})
                        </p>
                        <AnimatePresence>
                          {availableSlots.map((s) => (
                            <AdminSlotRow
                              key={s.id}
                              slot={s}
                              onAction={handleSlotAction}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Override / Assign dialog */}
      <OverrideDialog
        slot={activeSlot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}
