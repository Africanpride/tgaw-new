import { describe, expect, it } from "bun:test";
import {
	buildIcs,
	escapeIcsText,
	foldLine,
	formatIcsUtcDate,
	getFeedWindow,
	sanitizeUri,
	type IcsEventInput,
} from "./ics";

describe("escapeIcsText", () => {
	it("escapes backslashes first, then separators and newlines", () => {
		expect(escapeIcsText("a;b,c\nd\\e")).toBe("a\\;b\\,c\\nd\\\\e");
	});

	it("normalises CRLF to \\n", () => {
		expect(escapeIcsText("one\r\ntwo")).toBe("one\\ntwo");
	});
});

describe("sanitizeUri", () => {
	it("strips raw newlines so a URL cannot inject headers", () => {
		expect(sanitizeUri("https://x.test/a\r\nINJECTED:1")).toBe(
			"https://x.test/aINJECTED:1",
		);
	});
});

describe("formatIcsUtcDate", () => {
	it("formats a Date as a basic-format UTC timestamp", () => {
		expect(formatIcsUtcDate(new Date("2026-09-27T08:05:00.000Z"))).toBe(
			"20260927T080500Z",
		);
	});
});

describe("getFeedWindow", () => {
	it("spans 30 days back and one year forward as YYYY-MM-DD", () => {
		const { startDate, endDate } = getFeedWindow(
			new Date("2026-09-27T12:00:00Z"),
		);
		expect(startDate).toBe("2026-08-28");
		expect(endDate).toBe("2027-09-27");
	});
});

describe("foldLine", () => {
	it("leaves short lines untouched", () => {
		expect(foldLine("SUMMARY:hello")).toBe("SUMMARY:hello");
	});

	it("folds long lines with a CRLF + space continuation", () => {
		const long = "DESCRIPTION:" + "x".repeat(200);
		const folded = foldLine(long);
		const physical = folded.split("\r\n");
		expect(physical.length).toBeGreaterThan(1);
		expect(physical[1].startsWith(" ")).toBe(true);
		expect(
			physical.map((l) => (l.startsWith(" ") ? l.slice(1) : l)).join(""),
		).toBe(long);
	});
});

describe("buildIcs", () => {
	const item: IcsEventInput = {
		uid: "slot-abc@tgaw",
		start: new Date("2026-09-27T08:00:00Z"),
		end: new Date("2026-09-27T09:00:00Z"),
		summary: "Bible Reading; Bring a friend,",
		description: "Line1\nLine2",
		url: "https://zoom.us/j/123",
	};
	const stamp = new Date("2026-09-27T10:00:00Z");

	it("wraps events in a valid VCALENDAR envelope", () => {
		const ics = buildIcs([item], stamp);
		expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
		expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
		expect(ics).toContain("VERSION:2.0");
		expect(ics).toContain("CALSCALE:GREGORIAN");
		expect(ics).toContain("X-WR-CALNAME:The Global Altar Watch");
	});

	it("emits escaped, UTC-stamped events with a 15-minute alarm", () => {
		const ics = buildIcs([item], stamp);
		expect(ics).toContain("UID:slot-abc@tgaw");
		expect(ics).toContain("DTSTAMP:20260927T100000Z");
		expect(ics).toContain("DTSTART:20260927T080000Z");
		expect(ics).toContain("DTEND:20260927T090000Z");
		expect(ics).toContain("SUMMARY:Bible Reading\\; Bring a friend\\,");
		expect(ics).toContain("DESCRIPTION:Line1\\nLine2");
		expect(ics).toContain("URL:https://zoom.us/j/123");
		expect(ics).toContain("STATUS:CONFIRMED");
		expect(ics).toContain("SEQUENCE:0");
		expect(ics).toContain("BEGIN:VALARM");
		expect(ics).toContain("TRIGGER:-PT15M");
		expect(ics).toContain("ACTION:DISPLAY");
	});

	it("omits optional properties that are absent", () => {
		const bare: IcsEventInput = {
			uid: "event-x@tgaw",
			start: new Date("2026-09-27T08:00:00Z"),
			end: new Date("2026-09-27T09:00:00Z"),
			summary: "Prayer",
		};
		const ics = buildIcs([bare], stamp);
		expect((ics.match(/DESCRIPTION:/g) ?? []).length).toBe(1);
		expect(ics).not.toContain("URL:");
	});

	it("sorts events chronologically", () => {
		const later: IcsEventInput = {
			...item,
			uid: "event-later@tgaw",
			start: new Date("2026-09-28T08:00:00Z"),
			end: new Date("2026-09-28T09:00:00Z"),
		};
		const ics = buildIcs([later, item], stamp);
		expect(ics.indexOf("UID:slot-abc@tgaw")).toBeLessThan(
			ics.indexOf("UID:event-later@tgaw"),
		);
	});
});
