import { describe, expect, it } from "bun:test"
import {
  floatingBarClass,
  formatDockBadge,
  getDockInitials,
  getMobileDockCounts,
  isDockPathActive,
  selectedSlotsBarClass,
} from "@/lib/mobileDock"

describe("mobile dock helpers", () => {
  it("matches exact destination paths", () => {
    expect(isDockPathActive("/overview", "/overview")).toBe(true)
    expect(isDockPathActive("/booking", "/booking")).toBe(true)
    expect(isDockPathActive("/settings", "/settings")).toBe(true)
  })

  it("matches feed and message subpaths", () => {
    expect(isDockPathActive("/feed", "/feed")).toBe(true)
    expect(isDockPathActive("/feed/example", "/feed")).toBe(true)
    expect(isDockPathActive("/messages/conversation-1", "/messages")).toBe(true)
  })

  it("does not activate unrelated dashboard paths", () => {
    expect(isDockPathActive("/admin", "/settings")).toBe(false)
    expect(isDockPathActive("/feed", "/messages")).toBe(false)
  })

  it("formats badge counts without rendering zero", () => {
    expect(formatDockBadge(0)).toBeNull()
    expect(formatDockBadge(9)).toBe("9")
    expect(formatDockBadge(10)).toBe("9+")
    expect(formatDockBadge(99)).toBe("9+")
  })

  it("derives a safe initials fallback", () => {
    expect(getDockInitials("Ada Lovelace")).toBe("AL")
    expect(getDockInitials("")).toBe("?")
    expect(getDockInitials(null)).toBe("?")
  })

  it("counts today's bookings and unread messages for the dock", async () => {
    let slotCalls = 0
    let messageCalls = 0
    const db = {
      slot: {
        count: async () => {
          slotCalls += 1
          return 3
        },
      },
      message: {
        count: async () => {
          messageCalls += 1
          return messageCalls === 1 ? 15 : 3
        },
      },
    }

    await expect(getMobileDockCounts("user-1", db as never)).resolves.toEqual({
      todayBookings: 3,
      unreadMessages: 12,
    })
    expect(slotCalls).toBe(1)
    expect(messageCalls).toBe(2)
  })

  it("keeps floating action bars clear of the mobile dock", () => {
    const classes = floatingBarClass()
    expect(classes).toContain("bottom-[calc(env(safe-area-inset-bottom)+4.75rem)]")
    expect(classes).toContain("md:bottom-4")
  })

  it("keeps the selected-slots bar slightly rounded", () => {
    const classes = selectedSlotsBarClass()
    expect(classes).toContain("rounded-xs")
    expect(classes).not.toContain("rounded-full")
  })
})
