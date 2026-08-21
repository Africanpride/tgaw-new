import { describe, expect, it } from "bun:test"
import { planEventBlock, type BlockableSlot } from "./eventBlockService"

function slot(partial: Partial<BlockableSlot> & { startTime: string; endTime: string }): BlockableSlot {
  return {
    id: partial.id ?? "s",
    type: partial.type ?? "PRAYER",
    date: partial.date ?? "2026-08-18",
    startTime: partial.startTime,
    endTime: partial.endTime,
    bookedBy: partial.bookedBy ?? null,
    previousBookerId: partial.previousBookerId ?? null,
    eventId: partial.eventId ?? null,
  }
}

const weekday: BlockableSlot[] = [
  slot({ id: "a", type: "PRAYER", startTime: "08:30", endTime: "09:00" }),
  slot({ id: "b", type: "PRAYER", startTime: "09:00", endTime: "09:30", bookedBy: "u1" }),
  slot({ id: "c", type: "PRAYER", startTime: "09:30", endTime: "10:00", bookedBy: "u2" }),
  slot({ id: "d", type: "PRAYER", startTime: "10:00", endTime: "10:30" }),
  slot({ id: "e", type: "BIBLE", startTime: "09:00", endTime: "09:30" }),
  slot({ id: "f", type: "PRAISE_WORSHIP", startTime: "09:00", endTime: "09:30", bookedBy: "u3" }),
]

describe("planEventBlock", () => {
  it("blocks only overlapping slots of the allowed types", () => {
    const plan = planEventBlock(
      weekday,
      { date: "2026-08-18", start: "09:00", end: "10:00" },
      new Set(["PRAYER"])
      )
    // slots b (09:00) and c (09:30) overlap; a is 08:30, d starts at the
    // exclusive end (10:00); e/f are wrong types.
    const ids = plan.map((op) => op.slotId).sort()
    expect(ids).toEqual(["b", "c"])
  })

  it("displaces a booked slot when it overlaps and is not already blocked", () => {
    const plan = planEventBlock(
      weekday,
      { date: "2026-08-18", start: "09:00", end: "10:00" },
      new Set(["PRAYER"])
      )

    const b = plan.find((op) => op.slotId === "b")
    expect(b?.previousBookerId).toBe("u1")
    // c is also booked and displaced
    const c = plan.find((op) => op.slotId === "c")
    expect(c?.previousBookerId).toBe("u2")
  })

  it("does not re-block a slot already blocked by another event", () => {
    const alreadyBlocked: BlockableSlot[] = [
      slot({ id: "x", type: "PRAYER", startTime: "09:00", endTime: "09:30", eventId: "evt-other" }),
      slot({ id: "y", type: "PRAYER", startTime: "09:30", endTime: "10:00", bookedBy: "u9" }),
    ]
    const plan = planEventBlock(
      alreadyBlocked,
      { date: "2026-08-18", start: "09:00", end: "10:00" },
      new Set(["PRAYER"])
      )
    const ids = plan.map((op) => op.slotId)
    expect(ids).toContain("y")
    expect(ids).not.toContain("x")
  })
})