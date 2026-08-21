/**
 * Pure helpers that give slot payloads "special event precedence" context:
 * which Event blocks a slot, and which of the viewer's bookings were
 * displaced by an event block (see lib/services/eventBlockService.ts).
 */

export interface EventSummary {
  id: string;
  title: string;
  /** HH:MM UTC */
  startTime: string;
  /** HH:MM UTC */
  endTime: string;
  zoomUrl: string | null;
}

export interface SlotEventContext {
  event: EventSummary | null;
}

export interface EnrichableSlot {
  eventId: string | null;
}

export type EnrichedSlot<T extends EnrichableSlot> = T & SlotEventContext;

export interface DisplacedBooking {
  id: string;
  date?: string;
  type?: string;
  startTime: string;
  endTime: string;
  event: EventSummary | null;
}

/** An enriched slot that also carries displacement + timing info. */
export interface DisplaceableSlot extends EnrichableSlot {
  id: string;
  previousBookerId: string | null;
  startTime: string;
  endTime: string;
}

/** Attach each blocking event's summary to its slots; unblocked/unknown → null. */
export function enrichSlotsWithEvents<T extends EnrichableSlot>(
  slots: T[],
  events: EventSummary[],
): EnrichedSlot<T>[] {
  const eventsById = new Map(events.map((e) => [e.id, e]));
  return slots.map((slot) => ({
    ...slot,
    event: (slot.eventId && eventsById.get(slot.eventId)) || null,
  }));
}

/**
 * The viewer's bookings displaced by an active event block: slots where the
 * previous holder is the current user and an event still holds the slot.
 */
export function collectDisplacedBookings<T extends DisplaceableSlot>(
  slots: EnrichedSlot<T>[],
  currentUserId: string | undefined,
): DisplacedBooking[] {
  if (!currentUserId) return [];
  return slots.flatMap((slot) => {
    if (!slot.eventId || slot.previousBookerId !== currentUserId) return [];
    return [
      {
        id: slot.id,
        date: (slot as { date?: string }).date,
        type: (slot as { type?: string }).type,
        startTime: slot.startTime,
        endTime: slot.endTime,
        event: slot.event,
      },
    ];
  });
}
