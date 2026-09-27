import type { EventType } from "@prisma/client";
import { utcSlotToLocalDate } from "@/lib/calendar-utils";
import type { IcsEventInput } from "@/lib/calendar/ics";

export interface FeedSlotRow {
	id: string;
	type: EventType;
	date: string;
	startTime: string;
	endTime: string;
	notes: string | null;
}

export interface FeedEventRow {
	id: string;
	type: EventType;
	title: string;
	date: string;
	time: string;
	duration: number;
	notes: string | null;
	passage: string | null;
	zoomUrl: string | null;
}

export interface FeedMeetingLinkRow {
	type: EventType;
	date: string;
	url: string;
}

export interface FeedLabels {
	BIBLE: string;
	PRAYER: string;
	PRAISE_WORSHIP: string;
}

export function buildFeedItems(input: {
	slots: FeedSlotRow[];
	events: FeedEventRow[];
	meetingLinks: FeedMeetingLinkRow[];
	labels: FeedLabels;
}): IcsEventInput[] {
	// Exact date matches win; DEFAULT is the fallback (mirrors the calendar page).
	const linkMap = new Map<string, string>();
	for (const link of input.meetingLinks) {
		const key = `${link.type}|${link.date}`;
		if (link.date === "DEFAULT") {
			if (!linkMap.has(key)) linkMap.set(key, link.url);
		} else {
			linkMap.set(key, link.url);
		}
	}

	const items: IcsEventInput[] = [];

	for (const slot of input.slots) {
		const url =
			linkMap.get(`${slot.type}|${slot.date}`) ??
			linkMap.get(`${slot.type}|DEFAULT`);
		items.push({
			uid: `slot-${slot.id}@tgaw`,
			start: utcSlotToLocalDate(slot.date, slot.startTime),
			end: utcSlotToLocalDate(slot.date, slot.endTime),
			summary: input.labels[slot.type as keyof FeedLabels],
			description: slot.notes,
			url,
		});
	}

	for (const event of input.events) {
		const start = utcSlotToLocalDate(event.date, event.time);
		const end = new Date(start.getTime() + event.duration * 60_000);
		const description = [event.passage, event.notes]
			.filter((part): part is string => Boolean(part))
			.join("\n");
		items.push({
			uid: `event-${event.id}@tgaw`,
			start,
			end,
			summary: event.title,
			description: description || null,
			url: event.zoomUrl,
		});
	}

	return items;
}
