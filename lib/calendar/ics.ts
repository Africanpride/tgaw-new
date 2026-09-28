export interface IcsEventInput {
	uid: string;
	start: Date;
	end: Date;
	summary: string;
	description?: string | null;
	url?: string | null;
}

const encoder = new TextEncoder();

/** RFC 5545 §3.3.11 TEXT escaping. Backslash first so escapes are not re-escaped. */
export function escapeIcsText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.replace(/\n/g, "\\n")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,");
}

/** URIs are not TEXT-escaped, but must not contain raw CR/LF. */
export function sanitizeUri(value: string): string {
	return value.replace(/[\r\n]/g, "");
}

/** Date → `YYYYMMDDTHHMMSSZ` (RFC 5545 basic format, UTC). */
export function formatIcsUtcDate(date: Date): string {
	return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Rolling feed window: 30 days back, 12 months forward, as `YYYY-MM-DD` UTC. */
export function getFeedWindow(now: Date): {
	startDate: string;
	endDate: string;
} {
	const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const end = new Date(now.getTime());
	end.setUTCFullYear(end.getUTCFullYear() + 1);
	return {
		startDate: start.toISOString().slice(0, 10),
		endDate: end.toISOString().slice(0, 10),
	};
}

/** RFC 5545 §3.1 line folding: max 75 octets per line, continuation = CRLF + space. */
export function foldLine(line: string): string {
	const chunks: string[] = [];
	let current = "";
	let bytes = 0;
	for (const ch of line) {
		const chBytes = encoder.encode(ch).length;
		if (bytes + chBytes > 73) {
			chunks.push(current);
			current = "";
			bytes = 0;
		}
		current += ch;
		bytes += chBytes;
	}
	chunks.push(current);
	return chunks.join("\r\n ");
}

export function buildIcs(events: IcsEventInput[], dtstamp: Date): string {
	const stamp = formatIcsUtcDate(dtstamp);
	const lines: string[] = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//TGAW//Global Altar Watch//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:The Global Altar Watch",
	];

	const sorted = [...events].sort(
		(a, b) => a.start.getTime() - b.start.getTime(),
	);

	for (const event of sorted) {
		const summary = escapeIcsText(event.summary);
		lines.push(
			"BEGIN:VEVENT",
			`UID:${event.uid}`,
			`DTSTAMP:${stamp}`,
			`DTSTART:${formatIcsUtcDate(event.start)}`,
			`DTEND:${formatIcsUtcDate(event.end)}`,
			`SUMMARY:${summary}`,
		);
		if (event.description) {
			lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
		}
		if (event.url) {
			lines.push(`URL:${sanitizeUri(event.url)}`);
		}
		lines.push(
			"STATUS:CONFIRMED",
			"SEQUENCE:0",
			"TRANSP:OPAQUE",
			"BEGIN:VALARM",
			"TRIGGER:-PT15M",
			"ACTION:DISPLAY",
			`DESCRIPTION:${summary}`,
			"END:VALARM",
			"END:VEVENT",
		);
	}

	lines.push("END:VCALENDAR");
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
