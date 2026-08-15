import { formatInTimeZone } from "date-fns-tz";

/**
 * Convert a UTC date string + time string to a Date object.
 */
export function utcSlotToLocalDate(
	dateStr: string,
	timeStr: string,
): Date {
	return new Date(`${dateStr}T${timeStr}:00Z`);
}

/**
 * Convert a UTC HH:MM time to the user's local HH:MM.
 */
export function convertTimeToTimezone(
	timeStr: string,
	dateStr: string,
	timezone: string,
): string {
	const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);
	return formatInTimeZone(utcDate, timezone, "HH:mm");
}
