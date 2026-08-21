import { describe, expect, it } from "bun:test"
import {
	collectDisplacedBookings,
	enrichSlotsWithEvents,
	type EventSummary,
} from "./slotEventEnrichment"

function event(partial: Partial<EventSummary> = {}): EventSummary {
	return {
		id: partial.id ?? "evt-1",
		title: partial.title ?? "Easter Vigil",
		startTime: partial.startTime ?? "09:00",
		endTime: partial.endTime ?? "10:00",
		zoomUrl: partial.zoomUrl ?? null,
	}
}

interface RawSlot {
	id: string
	eventId: string | null
	previousBookerId: string | null
}

function slot(partial: Partial<RawSlot> & { id: string }): RawSlot {
	return {
		eventId: partial.eventId ?? null,
		previousBookerId: partial.previousBookerId ?? null,
		...partial,
	}
}

describe("enrichSlotsWithEvents", () => {
	it("attaches the matching event summary to each event-blocked slot", () => {
		const events = [event({ id: "evt-1", title: "Easter Vigil" })]
		const slots = [
			slot({ id: "a", eventId: null }),
			slot({ id: "b", eventId: "evt-1" }),
			slot({ id: "c", eventId: "evt-1" }),
		]

		const enriched = enrichSlotsWithEvents(slots, events)

		expect(enriched.find((s) => s.id === "b")?.event?.title).toBe("Easter Vigil")
		expect(enriched.find((s) => s.id === "c")?.event?.title).toBe("Easter Vigil")
	})

	it("leaves unblocked slots with a null event", () => {
		const events = [event()]
		const slots = [slot({ id: "a", eventId: null })]

		const enriched = enrichSlotsWithEvents(slots, events)

		expect(enriched[0].event).toBeNull()
	})

	it("degrades gracefully when a blocked slot references a missing event", () => {
		const events: EventSummary[] = []
		const slots = [slot({ id: "x", eventId: "evt-gone" })]

		const enriched = enrichSlotsWithEvents(slots, events)

		expect(enriched[0].event).toBeNull()
	})
})

describe("collectDisplacedBookings", () => {
	const events = [
		event({ id: "evt-1", title: "Easter Vigil", startTime: "09:00", endTime: "10:30" }),
	]

	function enrichedSlot(id: string, previousBookerId: string | null, eventId: string | null) {
		return enrichSlotsWithEvents(
			[{ ...slot({ id, eventId, previousBookerId }), type: "PRAYER", date: "2026-08-21", startTime: "09:00", endTime: "09:30" }],
			events,
		)[0]
	}

	it("returns the viewer's displaced bookings with their slot time and event title", () => {
		const slots = [
			enrichedSlot("mine", "user-1", "evt-1"),
			enrichedSlot("other", "user-2", "evt-1"),
			enrichedSlot("free", null, "evt-1"),
		]

		const displaced = collectDisplacedBookings(slots, "user-1")

		expect(displaced).toHaveLength(1)
		expect(displaced[0].id).toBe("mine")
		expect(displaced[0].startTime).toBe("09:00")
		expect(displaced[0].endTime).toBe("09:30")
		expect(displaced[0].type).toBe("PRAYER")
		expect(displaced[0].date).toBe("2026-08-21")
		expect(displaced[0].event?.title).toBe("Easter Vigil")
	})

	it("ignores displacement that belongs to someone else or has no viewer", () => {
		const slots = [
			enrichedSlot("other", "user-2", "evt-1"),
			enrichedSlot("free", null, "evt-1"),
		]

		expect(collectDisplacedBookings(slots, "user-1")).toHaveLength(0)
		expect(collectDisplacedBookings(slots, undefined)).toHaveLength(0)
	})
})
