import { addDays, startOfMonth } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CalendarItem, CalendarItemColor } from "./calendar-view";

export type CalendarViewMode = "year" | "month" | "week" | "day";

export const CALENDAR_VIEW_MODES: CalendarViewMode[] = [
	"year",
	"month",
	"week",
	"day",
];

export function isCalendarViewMode(
	value: string | null | undefined,
): value is CalendarViewMode {
	return value != null && (CALENDAR_VIEW_MODES as string[]).includes(value);
}

export const CALENDAR_COLORS: Record<CalendarItemColor, string> = {
	purple: "bg-purple-500",
	red: "bg-red-500",
	amber: "bg-amber-500",
	blue: "bg-blue-500",
	violet: "bg-violet-500",
};

/** 42 cells (6 weeks), Sunday-first — matches the month grid layout. */
export function buildMonthCells(month: Date): Date[] {
	const first = startOfMonth(month);
	const start = addDays(first, -first.getDay());
	return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Local "yyyy-MM-dd" key for an item's UTC instant, projected into the user's timezone. */
export function dayKeyInTz(item: CalendarItem, timezone: string): string {
	return formatInTimeZone(new Date(item.date), timezone, "yyyy-MM-dd");
}

/** "HH:MM" → minutes since midnight. */
export function parseHm(hm: string): number {
	const [h, m] = hm.split(":").map(Number);
	return (h || 0) * 60 + (m || 0);
}

/** Minutes [start, end) for an item in the user's timezone. */
export function itemMinutes(item: CalendarItem): { start: number; end: number } {
	const start = parseHm(item.startTime);
	let duration: number;
	if (item.endTime) {
		const rawEnd = parseHm(item.endTime);
		// Projection across midnight can make end <= start (e.g. "24:00" → "00:00");
		// hourly slots are always 60 minutes, so fall back to that.
		duration = rawEnd > start ? rawEnd - start : 60;
	} else {
		duration = Math.max(item.duration ?? 60, 30);
	}
	return { start, end: start + duration };
}
