# Premium Booking UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the TGAW Slot Booking UI to a premium, app-store-quality finish: centered confirmation/cancel dialogs, a grouped and tactile slot timeline, animated type tabs, a density-aware mini calendar, polished cards, and no horizontal overflow.

**Architecture:** Client-side UI polish only — no backend, API, schema, or service-layer changes. All changes are isolated to `app/(dashboard)/booking/page.tsx` and `components/booking/*`, plus a new shared accent module and a small overflow fix in `SlotBookingStrip` + the three devotion pages. The confirmation bottom-sheet is replaced with a centered `Dialog`; both `window.confirm` browser prompts are replaced with centered `AlertDialog`s.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui primitives, `motion/react`, `lucide-react`, `date-fns`.

## Global Constraints

- Use shadcn semantic tokens (`bg-card`, `bg-muted`, `bg-popover`, `border-border`, `text-muted-foreground`, `bg-primary`) — never ad-hoc hex colors. Type accent hues (`purple-500` / `red-500` / `amber-500`) are allowed **only** for left-rail accents, selection highlights, badges, and icons — never as full-bleed fills.
- **Never build dynamic Tailwind class names** (e.g. `` `bg-${color}/10` ``). Tailwind v4 can't see them, so the styles silently don't apply. Use literal class strings via the shared `slotAccent` module.
- Use `motion/react` (import from `"motion/react"`). Respect `prefers-reduced-motion` via `useReducedMotion()` (pattern already in `app/(dashboard)/settings/page.tsx`).
- No new browser dialogs: `window.confirm` / `alert` / `prompt` are banned — use shadcn `Dialog` / `AlertDialog`.
- Icons must be `aria-hidden="true"` or carry a `<title>`; slot cells must be keyboard accessible.
- Touch targets ≥ 44px; no horizontal overflow at 360px; dark mode must look correct.
- Verification commands: `bun run typecheck` and `bun run build` must pass. There is no unit-test runner for UI components in this repo, so each task's gate is typecheck + build + the listed manual checks.
- Only commit when the user explicitly asks. Do not commit after each task on your own.

---

### Task 1: Fix horizontal overflow in `SlotBookingStrip` + devotion pages

**Files:**
- Modify: `components/booking/SlotBookingStrip.tsx:69` (ScrollArea + inner flex)
- Modify: `app/(dashboard)/bible/page.tsx:47`, `app/(dashboard)/prayer/page.tsx` (Slot card), `app/(dashboard)/worship/page.tsx` (Slot card)

**Problem:** The strip's inner `<div className="flex w-max space-x-2 p-4">` has a huge intrinsic width (48 slots). It sits inside `<ScrollArea>` inside a `<Card>` that is a flex item of the page's `flex flex-col`. Flex items default to `min-width: auto`, so the Card refuses to shrink below the strip's min-content width → the "Today's Slots" card overflows the viewport.

**Interfaces:**
- Consumes: existing `SlotBookingStrip` props (`slots: SlotData[]`, `type: EventType`).
- Produces: `SlotBookingStrip` remains externally identical; the rendered `Card` on each devotion page now has `min-w-0`.

- [ ] **Step 1: Add `overflow-hidden` + `min-w-0` to the ScrollArea**

In `components/booking/SlotBookingStrip.tsx`, change:

```tsx
<ScrollArea className="w-full whitespace-nowrap rounded-md border">
  <div className="flex w-max space-x-2 p-4">
```

to:

```tsx
<ScrollArea className="w-full max-w-full overflow-hidden whitespace-nowrap rounded-md border">
  <div className="flex w-max min-w-full space-x-2 p-4">
```

- [ ] **Step 2: Add `min-w-0` to the wrapping Card on each devotion page**

In `app/(dashboard)/bible/page.tsx`, change the slot card:

```tsx
<Card className="border-purple-500/20 shadow-md">
```

to:

```tsx
<Card className="min-w-0 border-purple-500/20 shadow-md">
```

Do the same for the equivalent slot card in `app/(dashboard)/prayer/page.tsx` and `app/(dashboard)/worship/page.tsx` (they each wrap `<SlotBookingStrip .../>` in a `Card`). Read each file to locate the exact `Card` element wrapping `SlotBookingStrip` before editing.

- [ ] **Step 3: Verify**

Run: `bun run typecheck`
Expected: PASS (no errors).

Manual: open `/bible` at 360px width — the "Today's Slots" card must fit the screen with only the strip scrolling horizontally, no page-level horizontal scroll.

- [ ] **Step 4: Commit**

Only if the user has explicitly asked to commit.

---

### Task 2: Shared `slotAccent` literal-class module

**Files:**
- Create: `components/booking/slotAccent.ts`

**Interfaces:**
- Consumes: `EventType` from `@prisma/client`.
- Produces: `export const slotAccent: Record<EventType, SlotAccent>` where every value is a literal Tailwind class string (so Tailwind v4 emits it). Field meanings:
  - `text` — accent text colour for time ranges / active tab label
  - `tabFill` — active tab background fill (light + dark)
  - `solid` — solid accent badge/confirm-button classes
  - `tint` — light accent background (e.g. `bg-purple-500/10`)
  - `tintStrong` — slightly stronger accent background
  - `rail` — left border rail (e.g. `border-l-purple-500`)
  - `iconTile` — rounded square behind the type icon (Dialog header, empty state)
  - `dot` — calendar density dot (any booking)
  - `dotStrong` — calendar density dot (own booking)

- [ ] **Step 1: Create the module**

Create `components/booking/slotAccent.ts`:

```ts
import type { EventType } from "@prisma/client";

export interface SlotAccent {
  text: string;
  tabFill: string;
  solid: string;
  tint: string;
  tintStrong: string;
  rail: string;
  iconTile: string;
  dot: string;
  dotStrong: string;
}

export const slotAccent: Record<EventType, SlotAccent> = {
  BIBLE: {
    text: "text-purple-700 dark:text-purple-300",
    tabFill: "bg-purple-100 dark:bg-purple-900/60",
    solid: "bg-purple-600 text-white hover:bg-purple-700",
    tint: "bg-purple-500/10",
    tintStrong: "bg-purple-500/15",
    rail: "border-l-purple-500",
    iconTile: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200",
    dot: "bg-purple-500/50",
    dotStrong: "bg-purple-500",
  },
  PRAYER: {
    text: "text-red-700 dark:text-red-300",
    tabFill: "bg-red-100 dark:bg-red-900/60",
    solid: "bg-red-600 text-white hover:bg-red-700",
    tint: "bg-red-500/10",
    tintStrong: "bg-red-500/15",
    rail: "border-l-red-500",
    iconTile: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
    dot: "bg-red-500/50",
    dotStrong: "bg-red-500",
  },
  PRAISE_WORSHIP: {
    text: "text-amber-700 dark:text-amber-300",
    tabFill: "bg-amber-100 dark:bg-amber-900/60",
    solid: "bg-amber-600 text-white hover:bg-amber-700",
    tint: "bg-amber-500/10",
    tintStrong: "bg-amber-500/15",
    rail: "border-l-amber-500",
    iconTile: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
    dot: "bg-amber-500/50",
    dotStrong: "bg-amber-500",
  },
};
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

---

### Task 3: Centered confirmation Dialog (`SlotBookingSheet` rewrite)

**Files:**
- Modify: `components/booking/SlotBookingSheet.tsx` (full rewrite)

**Interfaces:**
- Consumes: `slotAccent` (Task 2), `SlotData` (existing from `./SlotCell`), existing props `{ open, onOpenChange, selectedSlots, type, onConfirm, isSubmitting }`.
- Produces: same props as before, so `SlotBookingStrip` and the booking page keep working unchanged.

- [ ] **Step 1: Rewrite using a centered `Dialog`**

Replace the entire file with:

```tsx
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

        <DialogFooter className="border-t bg-muted/30 px-6 py-4 sm:justify-end">
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
```

> Note: `DialogContent` is already centered by the primitive (`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, `zoom-in-95` on open). The `overflow-hidden` + inner padding keeps the tinted header flush to the rounded corners and the footer pinned; the dialog scrolls internally on short viewports.

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

Manual: on `/booking`, select a slot → "Book Selected" → the dialog must be **centered** on screen (desktop and 360px mobile), show the accent header, time range, notes, and footer; close/cancel works; dialog stays within the viewport with no clipped buttons.

---

### Task 4: Centered cancel + delete `AlertDialog`s

**Files:**
- Modify: `app/(dashboard)/booking/page.tsx` (replace `window.confirm` cancel flow)
- Modify: `components/booking/AdminMeetingLinkManager.tsx:55` (replace `window.confirm` delete)

**Interfaces:**
- Consumes: `AlertDialog` primitives from `@/components/ui/alert-dialog`, `SlotData`.
- Produces: no exported changes; the page manages a `cancelSlot: SlotData | null` state and renders one shared `AlertDialog` for cancelling bookings.

- [ ] **Step 1: Add a centered cancel `AlertDialog` in the booking page**

In `app/(dashboard)/booking/page.tsx`:

1. Add imports:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarX2 } from "lucide-react";
```

2. Add state next to the other `useState` calls:

```tsx
const [cancelTarget, setCancelTarget] = useState<SlotData | null>(null);
```

3. Replace the existing `handleCancelBooking` (which uses `window.confirm`) with a version that opens the dialog:

```tsx
const handleCancelBooking = (slot: SlotData) => {
  setCancelTarget(slot);
};

const confirmCancelBooking = async () => {
  if (!cancelTarget) return;
  const result = await cancelSlotAction({ slotId: cancelTarget.id });
  setCancelTarget(null);
  if (result.success) {
    toast.success("Booking cancelled");
    const dateStr = format(date, "yyyy-MM-dd");
    const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`);
    const data = await res.json();
    if (data.success) setSlots(data.data.slots);
  } else {
    toast.error(result.error || "Failed to cancel booking");
  }
};
```

4. Update the `MyBookingsCards` usage to pass the full slot to the handler (`onCancel={handleCancelBooking}`). `MyBookingsCards`'s `onCancel` signature is updated in Task 7 to `(slot: SlotData) => void` — wire it here now.

5. Render the centered `AlertDialog` just before the closing `</div>` of the page (next to `SlotBookingSheet`):

```tsx
<AlertDialog
  open={!!cancelTarget}
  onOpenChange={(open) => !open && setCancelTarget(null)}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <CalendarX2 className="size-4 text-destructive" aria-hidden="true" />
        Cancel this booking?
      </AlertDialogTitle>
      <AlertDialogDescription>
        {cancelTarget
          ? `Your ${type.replace("_", " ").toLowerCase()} slot at ${cancelTarget.startTime} will be freed for others.`
          : ""}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep booking</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmCancelBooking}
        className="bg-destructive text-white hover:bg-destructive/90"
      >
        Cancel booking
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 2: Replace the delete-link `window.confirm` in `AdminMeetingLinkManager.tsx`**

Read `components/booking/AdminMeetingLinkManager.tsx` first. Import the `AlertDialog` primitives, add `const [deleteTarget, setDeleteTarget] = useState<{ type: string; date: string } | null>(null);`, replace the `if (!confirm(...)) return;` line with `setDeleteTarget({ type, date });`, and render a centered `AlertDialog` (title "Delete meeting link?", destructive `AlertDialogAction` that performs the existing delete `fetch` to `/api/v1/slots/meeting-link?type=...&date=...` and closes). Match the exact pattern from Step 1.

- [ ] **Step 3: Verify**

Run: `bun run typecheck`
Expected: PASS.

Manual: on `/booking`, click Cancel on a booking → a **centered** destructive `AlertDialog` appears; "Keep booking" dismisses, "Cancel booking" cancels and toasts. As a leader on `/admin`, deleting a meeting link shows the centered confirm instead of the browser prompt.

---

### Task 5: Redesigned `SlotCell`

**Files:**
- Modify: `components/booking/SlotCell.tsx`

**Interfaces:**
- Consumes: `slotAccent` (Task 2).
- Produces: keeps `SlotData` export and `SlotCell` props `{ slot, isSelected, onSelect, accent }` — **note `accentColorClass` is replaced with `accent: SlotAccent`**, so `SlotTimeline` must be updated (Task 6).

- [ ] **Step 1: Rewrite `SlotCell`**

Replace `components/booking/SlotCell.tsx` with:

```tsx
"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { slotAccent, type SlotAccent } from "./slotAccent";

export interface SlotData {
  id: string;
  type?: string;
  date?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isOwnBooking: boolean;
  bookedByName: string | null;
  bookedByImage: string | null;
  notes: string | null;
}

interface SlotCellProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  accent: SlotAccent;
}

export function convertUtcTimeToLocal(utcTime: string) {
  const [hours, minutes] = utcTime.split(":");
  const d = new Date();
  d.setUTCHours(parseInt(hours, 10));
  d.setUTCMinutes(parseInt(minutes, 10));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SlotCell({ slot, isSelected, onSelect, accent }: SlotCellProps) {
  const isAvailable = !slot.isBooked;

  return (
    <motion.div
      layout={isSelected}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      onClick={(e) => onSelect(slot.id, e.shiftKey)}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
      aria-label={`${convertUtcTimeToLocal(slot.startTime)} to ${convertUtcTimeToLocal(
        slot.endTime,
      )} slot, ${isAvailable ? (isSelected ? "selected" : "available") : "booked"}`}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(slot.id, e.shiftKey);
        }
      }}
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center border-b border-l-4 border-transparent px-3 py-2 transition-colors select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isAvailable ? "hover:bg-muted/50" : "cursor-not-allowed opacity-60",
        isSelected && isAvailable && cn(accent.tint, accent.rail),
        slot.isOwnBooking && cn(accent.tintStrong, accent.rail),
      )}
    >
      <div className="w-20 shrink-0 font-medium text-sm tabular-nums">
        {convertUtcTimeToLocal(slot.startTime)}
      </div>

      <div className="ml-4 flex flex-1 items-center justify-between gap-2">
        {isAvailable ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", isSelected ? accent.dotStrong : "bg-muted-foreground/40")} />
            {isSelected ? "Selected" : "Available"}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant={slot.isOwnBooking ? "default" : "secondary"}
              className={cn(slot.isOwnBooking && cn(accent.solid))}
            >
              {slot.isOwnBooking ? "My booking" : "Booked"}
            </Badge>
            {slot.bookedByName && (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={slot.bookedByImage || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {slot.bookedByName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {slot.bookedByName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isSelected && isAvailable && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "ml-2 flex size-5 shrink-0 items-center justify-center rounded-full",
            accent.solid,
          )}
        >
          <Check className="size-3" aria-hidden="true" />
        </motion.span>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: FAIL — `SlotTimeline` still passes `accentColorClass`. (This is expected; Task 6 fixes it.)

---

### Task 6: Grouped `SlotTimeline`

**Files:**
- Modify: `components/booking/SlotTimeline.tsx`

**Interfaces:**
- Consumes: `SlotCell` (Task 5) with the new `accent` prop; `slotAccent`.
- Produces: `SlotTimeline` props change from `{ slots, type, selectedIds, onSelectionChange }` to `{ slots, type, selectedIds, onSelectionChange, onEmptyAction }` where `onEmptyAction?: () => void` fires from the empty-state CTA.

- [ ] **Step 1: Rewrite `SlotTimeline` with grouped sections**

Replace `components/booking/SlotTimeline.tsx` with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarX2 } from "lucide-react";
import { SlotCell, SlotData, convertUtcTimeToLocal } from "./SlotCell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { slotAccent } from "./slotAccent";
import { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SlotTimelineProps {
  slots: SlotData[];
  type: EventType;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEmptyAction?: () => void;
}

interface SlotGroup {
  label: string;
  slots: SlotData[];
}

function localHour(utcTime: string) {
  const [hours] = convertUtcTimeToLocal(utcTime).split(":");
  return parseInt(hours, 10);
}

function groupSlots(slots: SlotData[]): SlotGroup[] {
  const groups: Record<string, SlotData[]> = {
    Morning: [],
    Midday: [],
    Evening: [],
    Night: [],
  };
  for (const slot of slots) {
    const h = localHour(slot.startTime);
    if (h >= 5 && h < 12) groups.Morning.push(slot);
    else if (h >= 12 && h < 17) groups.Midday.push(slot);
    else if (h >= 17 && h < 21) groups.Evening.push(slot);
    else groups.Night.push(slot);
  }
  return Object.entries(groups)
    .map(([label, s]) => ({ label, slots: s }))
    .filter((g) => g.slots.length > 0);
}

export function SlotTimeline({
  slots,
  type,
  selectedIds,
  onSelectionChange,
  onEmptyAction,
}: SlotTimelineProps) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const accent = slotAccent[type];
  const groups = useMemo(() => groupSlots(slots), [slots]);

  const handleSelect = (id: string, shiftKey: boolean) => {
    const targetSlot = slots.find((s) => s.id === id);
    if (!targetSlot || targetSlot.isBooked) return;

    if (shiftKey && lastSelectedId) {
      const startIndex = slots.findIndex((s) => s.id === lastSelectedId);
      const endIndex = slots.findIndex((s) => s.id === id);
      const min = Math.min(startIndex, endIndex);
      const max = Math.max(startIndex, endIndex);
      const newSelection: string[] = [];
      let canSelectAll = true;
      for (let i = min; i <= max; i++) {
        if (slots[i].isBooked) {
          canSelectAll = false;
          break;
        }
        newSelection.push(slots[i].id);
      }
      if (canSelectAll) {
        onSelectionChange(Array.from(new Set([...selectedIds, ...newSelection])));
      }
    } else {
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((sId) => sId !== id)
          : [...selectedIds, id],
      );
      setLastSelectedId(id);
    }
  };

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border py-14 text-center">
        <div className={cn("flex size-12 items-center justify-center rounded-full", accent.iconTile)}>
          <CalendarX2 className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium">No slots for this day</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          This day is quiet. Pick another day on the calendar to keep your devotional watch.
        </p>
        {onEmptyAction && (
          <Button variant="outline" size="sm" onClick={onEmptyAction} className="mt-1">
            Pick another day
          </Button>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[560px] w-full max-w-full overflow-hidden rounded-md border">
      <div className="flex flex-col">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="sticky top-0 z-10 flex items-center gap-2 border-y bg-popover/95 px-3 py-1.5 backdrop-blur">
              <span className={cn("h-1.5 w-1.5 rounded-full", accent.dotStrong)} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
              <span className="text-xs text-muted-foreground/70">
                · {group.slots.length} slot{group.slots.length === 1 ? "" : "s"}
              </span>
            </div>
            {group.slots.map((slot) => (
              <SlotCell
                key={slot.id}
                slot={slot}
                isSelected={selectedIds.includes(slot.id)}
                onSelect={handleSelect}
                accent={accent}
              />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS (the `accentColorClass` reference is gone).

Manual: `/booking` timeline shows Morning / Midday / Evening / Night sticky headers; clicking a slot highlights it with the accent rail + check; shift-click selects a consecutive range; empty day shows the illustrated empty state.

---

### Task 7: Animated `TypeTabs`

**Files:**
- Modify: `components/booking/TypeTabs.tsx`

**Interfaces:**
- Consumes: `slotAccent` (Task 2), `motion/react`.
- Produces: same props `{ value: EventType, onChange: (v: EventType) => void }`.

- [ ] **Step 1: Add a `layoutId` sliding indicator**

Replace `components/booking/TypeTabs.tsx` with:

```tsx
"use client";

import { motion } from "motion/react";
import { EventType } from "@prisma/client";
import { BookOpen, HandHeart, Music } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { slotAccent } from "./slotAccent";

interface TypeTabsProps {
  value: EventType;
  onChange: (value: EventType) => void;
}

const TABS: { value: EventType; label: string; short: string; icon: typeof BookOpen }[] = [
  { value: "BIBLE", label: "Bible Reading", short: "Bible", icon: BookOpen },
  { value: "PRAYER", label: "Prayer", short: "Prayer", icon: HandHeart },
  { value: "PRAISE_WORSHIP", label: "Praise & Worship", short: "Worship", icon: Music },
];

export function TypeTabs({ value, onChange }: TypeTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as EventType)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-1 bg-muted/60 p-1">
        {TABS.map(({ value: v, label, short, icon: Icon }) => {
          const isActive = value === v;
          const accent = slotAccent[v];
          return (
            <TabsTrigger
              key={v}
              value={v}
              className={cn(
                "relative flex h-9 items-center justify-center gap-2 px-2 text-sm font-medium transition-colors",
                isActive
                  ? cn(accent.text)
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="booking-type-indicator"
                  className={cn("absolute inset-0 rounded-md shadow-sm", accent.tabFill)}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 size-4" aria-hidden="true" />
              <span className="relative z-10 hidden sm:inline">{label}</span>
              <span className="relative z-10 sm:hidden">{short}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

Manual: switching tabs slides a tinted indicator between the three options with a spring; active label uses the type accent colour.

---

### Task 8: Density-aware `BookingCalendarMini`

**Files:**
- Modify: `components/booking/BookingCalendarMini.tsx`

**Interfaces:**
- Consumes: `slotAccent`, the shadcn `Calendar` `DayButton` component override.
- Produces: new props `{ date, onDateChange, bookedDates?: Set<string>, myBookedDates?: Set<string> }`.

- [ ] **Step 1: Add density dots under calendar days**

Replace `components/booking/BookingCalendarMini.tsx` with:

```tsx
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
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          className="rounded-md"
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
```

> Note: `CalendarDayButton` renders a `Button` with `flex-col` layout and wraps `props.children` (the day number). The dot is absolutely positioned at the bottom-centre of the cell so it doesn't shift the number. The `date-fns` `format` import is already available in the project.

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

Manual: days with bookings show an accent dot; days with your own booking show a stronger dot; today and the selected day render the default calendar ring.

---

### Task 9: Premium `MyBookingsCards`

**Files:**
- Modify: `components/booking/MyBookingsCards.tsx`

**Interfaces:**
- Consumes: `slotAccent`.
- Produces: `onCancel` prop signature changes to `(slot: SlotData) => void` (passes the full slot so the page can show the AlertDialog from Task 4).

- [ ] **Step 1: Upgrade the cards + empty state**

Replace `components/booking/MyBookingsCards.tsx` with:

```tsx
"use client";

import { SlotData } from "./SlotCell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventType } from "@prisma/client";
import { CalendarCheck2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { slotAccent } from "./slotAccent";
import { convertUtcTimeToLocal } from "./SlotCell";

interface MyBookingsCardsProps {
  bookings: SlotData[];
  onCancel: (slot: SlotData) => void;
  type: EventType;
}

export function MyBookingsCards({ bookings, onCancel, type }: MyBookingsCardsProps) {
  const accent = slotAccent[type];

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <div className={cn("flex size-10 items-center justify-center rounded-full", accent.iconTile)}>
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">No bookings for this day</p>
          <p className="text-sm text-muted-foreground">
            Claim a slot and keep your devotional watch alive.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id} className={cn("overflow-hidden border-l-2", accent.rail)}>
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className={cn("flex items-center gap-1.5 font-semibold tabular-nums", accent.text)}>
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {convertUtcTimeToLocal(booking.startTime)} – {convertUtcTimeToLocal(booking.endTime)}
              </p>
              {booking.notes && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{booking.notes}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking)}
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

Manual: bookings show an accent rail + local-time range; Cancel opens the centered AlertDialog from Task 4; empty state shows the icon + copy.

---

### Task 10: `MeetingLinkCard` polish

**Files:**
- Modify: `components/booking/MeetingLinkCard.tsx`

**Interfaces:**
- Consumes: existing props `{ url: string, label: string | null }`.
- Produces: no API change.

- [ ] **Step 1: Add a `Video` icon tile + "Live" badge**

Replace `components/booking/MeetingLinkCard.tsx` with:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Video } from "lucide-react";
import { toast } from "sonner";

interface MeetingLinkCardProps {
  url: string;
  label: string | null;
}

export function MeetingLinkCard({ url, label }: MeetingLinkCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Video className="size-4" aria-hidden="true" />
          </span>
          <span className="flex-1 truncate">{label || "Meeting Link"}</span>
          <Badge variant="secondary" className="shrink-0">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="default" className="flex-1" onClick={() => window.open(url, "_blank")}>
            Join Meeting
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
            <Copy className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bun run typecheck`
Expected: PASS.

---

### Task 11: Booking page header, density wiring, sticky-bar motion, empty-state CTA

**Files:**
- Modify: `app/(dashboard)/booking/page.tsx`

**Interfaces:**
- Consumes: all updated components (Tasks 3, 4, 5, 6, 7, 8, 9), `motion/react`.
- Produces: page wires `bookedDates` / `myBookedDates` Sets into `BookingCalendarMini` and `onEmptyAction` into `SlotTimeline`.

- [ ] **Step 1: Add imports, motion, and density state**

At the top of `app/(dashboard)/booking/page.tsx`, add:

```tsx
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
```

Add state near the other `useState` calls:

```tsx
const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
const [myBookedDates, setMyBookedDates] = useState<Set<string>>(new Set());
const reduceMotion = useReducedMotion();
```

- [ ] **Step 2: Track density in the fetch effect**

Inside the existing `fetchSlots` effect, after `if (data.success)` update state:

```tsx
if (data.success) {
  setSlots(data.data.slots);
  setMeetingLink(data.data.meetingLinks[type]);

  const dateStr = format(date, "yyyy-MM-dd");
  const slots = data.data.slots as { isBooked: boolean; isOwnBooking: boolean }[];
  const hasAny = slots.some((s) => s.isBooked);
  const hasOwn = slots.some((s) => s.isOwnBooking);
  setBookedDates((prev) => {
    const next = new Set(prev);
    if (hasAny) next.add(dateStr);
    else next.delete(dateStr);
    return next;
  });
  setMyBookedDates((prev) => {
    const next = new Set(prev);
    if (hasOwn) next.add(dateStr);
    else next.delete(dateStr);
    return next;
  });
}
```

- [ ] **Step 3: Pass new props to `BookingCalendarMini` and `SlotTimeline`**

Update the `BookingCalendarMini` usage:

```tsx
<BookingCalendarMini
  date={date}
  onDateChange={(d) => d && setDate(d)}
  bookedDates={bookedDates}
  myBookedDates={myBookedDates}
  type={type}
/>
```

Update the `SlotTimeline` usage to pass `onEmptyAction` that clears selection:

```tsx
<SlotTimeline
  slots={slots}
  type={type}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  onEmptyAction={() => setSelectedIds([])}
/>
```

- [ ] **Step 4: Animate the sticky "Book Selected" bar**

Wrap the existing conditional sticky bar in an `AnimatePresence` and make it a `motion.div`:

```tsx
<AnimatePresence>
  {selectedIds.length > 0 && (
    <motion.div
      key="book-selected-bar"
      initial={reduceMotion ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduceMotion ? undefined : { y: 24, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="fixed bottom-4 left-0 right-0 z-10 flex justify-center px-4 md:absolute md:left-4 md:right-4 md:px-0"
    >
      <div className="flex w-full items-center gap-4 rounded-full border bg-popover px-4 py-2 shadow-lg md:w-auto">
        <span className="text-sm font-medium tabular-nums">
          {selectedIds.length} slot{selectedIds.length === 1 ? "" : "s"} selected
        </span>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          Book Selected
        </Button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

(Replace the inner hand-rolled `<button>` with the shadcn `Button`; keep the same layout.)

- [ ] **Step 5: Header polish**

Add a live date + type badge under the page title, replacing the static subtitle:

```tsx
<div>
  <h1 className="text-3xl font-bold tracking-tight">Slot Booking</h1>
  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
    {format(date, "EEEE, MMMM d")}
    <Badge variant="secondary">
      {type === "BIBLE" ? "Bible Reading" : type === "PRAYER" ? "Prayer" : "Praise & Worship"}
    </Badge>
  </p>
</div>
```

Add `Badge` to the page's imports from `@/components/ui/badge`.

- [ ] **Step 6: Verify**

Run: `bun run typecheck` then `bun run build`.
Expected: both PASS.

Manual: full pass on `/booking` — density dots appear, tabs slide, timeline groups, booking dialog is centered, cancel dialog is centered, sticky bar animates in/out, empty day shows CTA. Check 360px, 390px, 1024px, 1440px and dark mode.

---

### Task 12: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Run the full checks**

Run: `bun run typecheck` then `bun run build`.
Expected: both PASS with zero errors.

- [ ] **Step 2: Manual regression pass**

- `/booking`: select 1 and multiple consecutive slots (shift-click), confirm via centered Dialog, toast success, slot flips to "My booking"; cancel via centered AlertDialog; calendar dots; empty day; narrow viewport no horizontal overflow; dark mode.
- `/bible`, `/prayer`, `/worship`: "Today's Slots" strip scrolls horizontally inside its card, no page overflow; quick-book opens the same centered Dialog.
- `/admin`: booking config / meeting-link / slot-override panels still work; meeting-link delete uses the centered AlertDialog.
