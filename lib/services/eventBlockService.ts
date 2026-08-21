import { prisma } from "@/lib/db/prisma";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Compute an event's end time (HH:MM) from start time + duration in minutes. */
export function eventEndTime(start: string, durationMinutes: number): string {
  return fromMinutes(toMinutes(start) + durationMinutes);
}

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type BlockableType = "BIBLE" | "PRAYER" | "PRAISE_WORSHIP";

export interface BlockableSlot {
  id: string;
  type: BlockableType;
  date: string;
  startTime: string;
  endTime: string;
  bookedBy: string | null;
  previousBookerId: string | null;
  eventId: string | null;
}

export interface BlockOperation {
  slotId: string;
  /** The user who was displaced by this block (null if the slot was free). */
  previousBookerId: string | null;
}

export interface EventWindow {
  date: string;
  /** start time HH:MM (UTC) */
  start: string;
  /** end time HH:MM (UTC) */
  end: string;
}

/** The three normal slot types a Special Event may choose to block. */
export const BLOCKABLE_TYPES: BlockableType[] = [
  "BIBLE",
  "PRAYER",
  "PRAISE_WORSHIP",
];

/** Slot-blocking allowed-context: normal events block their own type only. */
export function blockableSlotTypes(eventType: string): Set<BlockableType> {
  if (eventType === "SPECIAL") return new Set(BLOCKABLE_TYPES);
  if (
    eventType === "BIBLE" ||
    eventType === "PRAYER" ||
    eventType === "PRAISE_WORSHIP"
  ) {
    return new Set([eventType as BlockableType]);
  }
  return new Set<BlockableType>();
}

/** A slot overlaps the event window when start < eventEnd && end > eventStart. */
function overlaps(slot: BlockableSlot, window: EventWindow): boolean {
  return slot.startTime < window.end && slot.endTime > window.start;
}

/**
 * Pure planning: decide how an event should block slots. Returns the list of
 * mutation operations (idempotent — already-blocked slots are skipped). Used by
 * both the preview (warning) and the apply step.
 */
export function planEventBlock(
  slots: BlockableSlot[],
  window: EventWindow,
  allowedTypes: Set<BlockableType>,
): BlockOperation[] {
  const ops: BlockOperation[] = [];
  for (const s of slots) {
    if (s.date !== window.date) continue;
    if (!allowedTypes.has(s.type)) continue;
    if (!overlaps(s, window)) continue;
    // Skip slots already blocked by another event.
    if (s.eventId) continue;
    ops.push({
      slotId: s.id,
      previousBookerId: s.bookedBy,
    });
  }
  return ops;
}

/* -------------------------------------------------------------------------- */
/*                                DB wrappers                                 */
/* -------------------------------------------------------------------------- */

/** Compute a slot planning preview for an event without mutating anything. */
export async function previewEventBlock(
  window: EventWindow,
  allowedTypes: Set<BlockableType>,
): Promise<{ operations: BlockOperation[]; displacingCount: number }> {
  const slots = await prisma.slot.findMany({
    where: { date: window.date, type: { in: [...allowedTypes] } },
    select: {
      id: true,
      type: true,
      date: true,
      startTime: true,
      endTime: true,
      bookedBy: true,
      previousBookerId: true,
      eventId: true,
    },
  });

  const operations = planEventBlock(
    slots.map((s) => ({ ...s, type: s.type as BlockableType })),
    window,
    allowedTypes,
  );
  const displacingCount = operations.filter((op) => op.previousBookerId).length;
  return { operations, displacingCount };
}

/**
 * Apply an event's block to slots: mark each planned slot with eventId, and for
 * booked slots move the current holder into previousBookerId (displacement).
 */
export async function applyEventBlock(
  eventId: string,
  window: EventWindow,
  allowedTypes: Set<BlockableType>,
): Promise<{ blockedCount: number; displaced: string[] }> {
  const { operations } = await previewEventBlock(window, allowedTypes);
  const displaced: string[] = [];

  for (const op of operations) {
    const data =
      op.previousBookerId != null
        ? {
            eventId,
            previousBookerId: op.previousBookerId,
            bookedBy: null,
          }
        : { eventId };
    await prisma.slot.update({
      where: { id: op.slotId },
      data,
    });
    if (op.previousBookerId != null) displaced.push(op.previousBookerId);
  }

  return { blockedCount: operations.length, displaced };
}

/**
 * Unblock all slots tied to an event, restoring any displaced booker back to
 * the slot (only if the slot is currently unbooked).
 */
export async function restoreEventBlock(
  eventId: string,
): Promise<{ restoredCount: number }> {
  const slots = await prisma.slot.findMany({
    where: { eventId },
    select: { id: true, previousBookerId: true, bookedBy: true },
  });

  let restoredCount = 0;
  for (const slot of slots) {
    const data: { eventId: null; previousBookerId: null; bookedBy?: string } = {
      eventId: null,
      previousBookerId: null,
    };
    if (slot.previousBookerId && !slot.bookedBy) {
      data.bookedBy = slot.previousBookerId;
      restoredCount++;
    }
    await prisma.slot.update({
      where: { id: slot.id },
      data: {
        eventId: null,
        previousBookerId: null,
        ...(slot.previousBookerId && !slot.bookedBy
          ? { bookedBy: slot.previousBookerId }
          : {}),
      },
    });
    void data;
  }

  return { restoredCount };
}