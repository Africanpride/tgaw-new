import { describe, expect, it } from "bun:test"
import {
  getActiveHostsForTime,
  type ActiveSlotLike,
} from "./slotService"

describe("getActiveHostsForTime", () => {
  it("returns null hosts when no slot is active", () => {
    const slots: ActiveSlotLike[] = [
      { type: "BIBLE", startTime: "08:00", endTime: "08:30", bookedBy: "u1" },
    ]
    expect(getActiveHostsForTime(slots, "10:00")).toEqual({
      BIBLE: null,
      PRAYER: null,
      PRAISE_WORSHIP: null,
    })
  })

  it("returns the booked user for the active slot of each type", () => {
    const slots: ActiveSlotLike[] = [
      { type: "BIBLE", startTime: "08:00", endTime: "08:30", bookedBy: "u1" },
      { type: "PRAYER", startTime: "08:30", endTime: "09:00", bookedBy: "u2" },
      {
        type: "PRAISE_WORSHIP",
        startTime: "09:00",
        endTime: "09:30",
        bookedBy: "u3",
      },
    ]
    expect(getActiveHostsForTime(slots, "08:45")).toEqual({
      BIBLE: null,
      PRAYER: "u2",
      PRAISE_WORSHIP: null,
    })
  })

  it("is inclusive of start time and exclusive of end time", () => {
    const slots: ActiveSlotLike[] = [
      { type: "BIBLE", startTime: "08:00", endTime: "08:30", bookedBy: "u1" },
    ]
    expect(getActiveHostsForTime(slots, "08:00").BIBLE).toBe("u1")
    expect(getActiveHostsForTime(slots, "08:30").BIBLE).toBeNull()
  })

  it("ignores unbooked slots", () => {
    const slots: ActiveSlotLike[] = [
      { type: "BIBLE", startTime: "08:00", endTime: "08:30", bookedBy: null },
    ]
    expect(getActiveHostsForTime(slots, "08:15")).toEqual({
      BIBLE: null,
      PRAYER: null,
      PRAISE_WORSHIP: null,
    })
  })

  it("picks a single active host per type when multiple consecutive slots are booked", () => {
    const slots: ActiveSlotLike[] = [
      { type: "BIBLE", startTime: "08:00", endTime: "08:30", bookedBy: "u1" },
      { type: "BIBLE", startTime: "08:30", endTime: "09:00", bookedBy: "u2" },
    ]
    // At 08:45 only the second slot is active
    expect(getActiveHostsForTime(slots, "08:45").BIBLE).toBe("u2")
  })
})
