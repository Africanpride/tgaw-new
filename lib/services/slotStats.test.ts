import { describe, expect, it } from "bun:test"
import { computeSlotStats, formatMinutes } from "./slotStats"
import { addDays, format } from "date-fns"

// Friday, 2026-08-21 (UTC). Week (Mon-start): Aug 17 – Aug 23.
const TODAY = new Date("2026-08-21T12:00:00Z")

function day(offsetFromToday: number): string {
	return format(addDays(TODAY, offsetFromToday), "yyyy-MM-dd")
}

describe("computeSlotStats", () => {
	it("counts sessions in the current calendar week (Monday start)", () => {
		const stats = computeSlotStats(
			[{ date: day(-4) }, { date: day(0) }, { date: day(2) }],
			TODAY,
		)
		// Aug 17 (Mon) .. Aug 23 (Sun) contains offsets -4, 0, +2.
		expect(stats.weekSessions).toBe(3)
	})

	it("excludes sessions from last week even when in the same month", () => {
		const stats = computeSlotStats([{ date: day(-5) }, { date: day(-4) }], TODAY)
		// -5 is Sunday Aug 16 → prior week; -4 is Monday Aug 17.
		expect(stats.weekSessions).toBe(1)
	})

	it("counts month sessions across weeks but not other months", () => {
		const stats = computeSlotStats(
			[
				{ date: day(-30) }, // ~Jul 22 → previous month
				{ date: day(-10) },
				{ date: day(0) },
				{ date: day(9) }, // Aug 30 → still August
			],
			TODAY,
		)
		expect(stats.monthSessions).toBe(3)
	})

	it("derives monthly time at 30 minutes per session", () => {
		const stats = computeSlotStats([{ date: day(0) }, { date: day(1) }, { date: day(2) }], TODAY)
		expect(stats.monthSessions).toBe(3)
		expect(stats.monthMinutes).toBe(90)
	})

	it("returns zeros for an empty booking list", () => {
		const stats = computeSlotStats([], TODAY)
		expect(stats).toEqual({
			weekSessions: 0,
			monthSessions: 0,
			monthMinutes: 0,
			weekByType: {},
			monthByType: {},
		})
	})

	it("breaks week and month sessions down per type", () => {
		const stats = computeSlotStats(
			[
				{ date: day(0), type: "PRAYER" },
				{ date: day(1), type: "BIBLE" },
				{ date: day(2), type: "PRAYER" },
				{ date: day(-10), type: "PRAISE_WORSHIP" }, // this month, last week
			],
			TODAY,
		)
		expect(stats.weekByType).toEqual({ PRAYER: 2, BIBLE: 1 })
		expect(stats.monthByType).toEqual({ PRAYER: 2, BIBLE: 1, PRAISE_WORSHIP: 1 })
	})
})

describe("formatMinutes", () => {
	it("formats exact hours without trailing minutes", () => {
		expect(formatMinutes(120)).toBe("2h")
	})

	it("formats sub-hour durations in minutes", () => {
		expect(formatMinutes(45)).toBe("45m")
	})

	it("formats mixed hours and minutes", () => {
		expect(formatMinutes(90)).toBe("1h 30m")
	})

	it("renders zero as 0m", () => {
		expect(formatMinutes(0)).toBe("0m")
	})
})
