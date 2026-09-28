import { describe, expect, it } from "bun:test";
import {
	buildFeedItems,
	type FeedLabels,
	type FeedSlotRow,
	type FeedEventRow,
	type FeedMeetingLinkRow,
} from "./feedItems";

const labels: FeedLabels = {
	BIBLE: "Bible Reading",
	PRAYER: "Prayer",
	PRAISE_WORSHIP: "Praise & Worship",
	SPECIAL: "Special Event",
};

const empty = {
	slots: [] as FeedSlotRow[],
	events: [] as FeedEventRow[],
	meetingLinks: [] as FeedMeetingLinkRow[],
	labels,
};

describe("buildFeedItems", () => {
	it("maps a booked slot to a UTC ICS item with its stable UID", () => {
		const items = buildFeedItems({
			...empty,
			slots: [
				{
					id: "s1",
					type: "BIBLE",
					date: "2026-09-27",
					startTime: "08:00",
					endTime: "09:00",
					notes: "Morning watch",
				},
			],
		});
		expect(items).toHaveLength(1);
		expect(items[0].uid).toBe("slot-s1@tgaw");
		expect(items[0].start.toISOString()).toBe("2026-09-27T08:00:00.000Z");
		expect(items[0].end.toISOString()).toBe("2026-09-27T09:00:00.000Z");
		expect(items[0].summary).toBe("Bible Reading");
		expect(items[0].description).toBe("Morning watch");
	});

	it("prefers an exact-date meeting link over DEFAULT", () => {
		const items = buildFeedItems({
			...empty,
			slots: [
				{
					id: "s2",
					type: "PRAYER",
					date: "2026-09-27",
					startTime: "21:00",
					endTime: "22:00",
					notes: null,
				},
			],
			meetingLinks: [
				{ type: "PRAYER", date: "DEFAULT", url: "https://example.com/default" },
				{ type: "PRAYER", date: "2026-09-27", url: "https://example.com/today" },
			],
		});
		expect(items[0].url).toBe("https://example.com/today");
	});

	it("falls back to the DEFAULT meeting link when no exact match exists", () => {
		const items = buildFeedItems({
			...empty,
			slots: [
				{
					id: "s3",
					type: "PRAISE_WORSHIP",
					date: "2026-09-28",
					startTime: "18:00",
					endTime: "19:00",
					notes: null,
				},
			],
			meetingLinks: [
				{
					type: "PRAISE_WORSHIP",
					date: "DEFAULT",
					url: "https://example.com/worship",
				},
			],
		});
		expect(items[0].url).toBe("https://example.com/worship");
	});

	it("computes event end from duration and joins passage with notes", () => {
		const items = buildFeedItems({
			...empty,
			events: [
				{
					id: "e1",
					type: "SPECIAL",
					title: "All-Night Vigil",
					date: "2026-09-28",
					time: "22:00",
					duration: 120,
					notes: "Bring a mat",
					passage: "Psalm 63",
					zoomUrl: "https://zoom.us/j/9",
				},
			],
		});
		expect(items).toHaveLength(1);
		expect(items[0].uid).toBe("event-e1@tgaw");
		expect(items[0].start.toISOString()).toBe("2026-09-28T22:00:00.000Z");
		expect(items[0].end.toISOString()).toBe("2026-09-29T00:00:00.000Z");
		expect(items[0].summary).toBe("All-Night Vigil");
		expect(items[0].description).toBe("Psalm 63\nBring a mat");
		expect(items[0].url).toBe("https://zoom.us/j/9");
	});

	it("returns an empty array when there is nothing to export", () => {
		expect(buildFeedItems(empty)).toEqual([]);
	});
});
