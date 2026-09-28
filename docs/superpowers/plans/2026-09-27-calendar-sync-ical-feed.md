# Calendar Sync (iCal Subscribe Feed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken/user-ID-token iCal link on `/calendar` with a correct, revocable iCal subscription feed plus a per-platform "Sync calendar" dialog that works with Google Calendar, Apple Calendar (iPhone/iPad/Mac) and Outlook.

**Architecture:** A pure ICS builder (`lib/calendar/ics.ts`) and a pure feed-item mapper (`lib/calendar/feedItems.ts`) are unit-tested with `bun:test`. A thin route handler (`app/api/v1/calendar/ical/route.ts`) authenticates via a revocable per-user token stored on `User.calendarFeedToken`, queries Slots/Events/MeetingLinks for a rolling window, and emits RFC 5545 with UTC times. Two server actions lazily create/regenerate the token; a client Dialog renders the URL (`https`/`webcal` toggle), copy button, per-platform instructions and a confirmed Regenerate action.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Prisma + MongoDB, `bun:test`, shadcn/ui (Dialog, Tabs, AlertDialog, Input, Label, Separator, Skeleton), react-i18next (`messages/{en,es,fr,pt}/calendar.json`), sonner toasts.

## Global Constraints

- Package manager/runtime: **Bun**. Verification commands: `bun test`, `bun run typecheck` (tsc --noEmit), `bun run lint` (eslint), `bun run i18n:check`.
- Route protection lives in `proxy.ts`; **never create `middleware.ts`**.
- Every new user-facing string must exist in **all four** locale files `messages/{en,es,fr,pt}/calendar.json` (en is the baseline; `i18n:check` fails on missing keys).
- No `window.alert/confirm/prompt`, no `window.location.href` assignment. Use shadcn Dialog/AlertDialog, `navigator.clipboard`, `toast()` from `sonner`.
- Styling: shadcn semantic tokens (`bg-card`, `border`, `text-muted-foreground`, `text-destructive`) only — no raw hex.
- Every `<svg>`/Lucide icon must carry `aria-hidden="true"` (or an explicit label).
- Links (`<Link>`) require `className="cursor-pointer"`; this plan adds no `<Link>`.
- **Commit only files belonging to this plan.** The working tree currently has unrelated dirty files (`lib/auth.ts`, `scripts/backup-mongo.ts`, `scripts/restore-mongo.ts`, `lib/db/mongoRecovery.*`, `docs/superpowers/*`, `.superpowers/sdd/progress.md`) — never `git add -A`.
- Conventional commit messages (`feat:`, `fix:`, `chore:`, `test:`).
- Tests colocate as `*.test.ts` and run under `bun:test` (`import { describe, expect, it } from "bun:test"`).

## File Structure

| File | Responsibility |
| --- | --- |
| `prisma/schema.prisma` (modify `User`) | Add `calendarFeedToken String?` + `@@index([calendarFeedToken])` |
| `lib/calendar/ics.ts` (create) | Pure RFC 5545 building: escaping, folding, UTC formatting, feed window, `buildIcs()` |
| `lib/calendar/ics.test.ts` (create) | Unit tests for the above |
| `lib/calendar/feedItems.ts` (create) | Pure mapping of Slot/Event/MeetingLink rows → `IcsEventInput[]` |
| `lib/calendar/feedItems.test.ts` (create) | Unit tests for mapping (incl. exact-date vs DEFAULT meeting link) |
| `app/api/v1/calendar/ical/route.ts` (rewrite) | Token auth → DB queries → build → `text/calendar` response |
| `actions/calendarFeedActions.ts` (create) | `ensureCalendarFeedToken()`, `regenerateCalendarFeedToken()` |
| `messages/{en,es,fr,pt}/calendar.json` (modify) | `sync.*` keys (31 per locale) |
| `components/calendar/sync-calendar-dialog.tsx` (create) | "Sync calendar" trigger + dialog UI |
| `app/(dashboard)/calendar/page.tsx` (modify) | Swap `IcalCopyButton` → `SyncCalendarDialog`, header row layout |
| `components/calendar/ical-copy-button.tsx` (delete) | Superseded |

**Interfaces (used across tasks):**

- `lib/calendar/ics.ts` produces: `interface IcsEventInput { uid: string; start: Date; end: Date; summary: string; description?: string | null; url?: string | null }`, `escapeIcsText(v: string): string`, `sanitizeUri(v: string): string`, `formatIcsUtcDate(d: Date): string`, `getFeedWindow(now: Date): { startDate: string; endDate: string }` (both `YYYY-MM-DD`), `foldLine(line: string): string`, `buildIcs(events: IcsEventInput[], dtstamp: Date): string`.
- `lib/calendar/feedItems.ts` consumes: `buildFeedItems({ slots, events, meetingLinks, labels })` where rows are `FeedSlotRow`, `FeedEventRow`, `FeedMeetingLinkRow`, `FeedLabels = { BIBLE; PRAYER; PRAISE_WORSHIP }` → `IcsEventInput[]`.
- `actions/calendarFeedActions.ts` produces: `ensureCalendarFeedToken(): Promise<string>`, `regenerateCalendarFeedToken(): Promise<string>` (both require a session).

---

### Task 1: Schema field `User.calendarFeedToken`

**Files:**
- Modify: `prisma/schema.prisma:480-505` (model `User`)

**Interfaces:**
- Produces: prisma client field `User.calendarFeedToken: string | null` plus `@@index([calendarFeedToken])`, so `prisma.user.findFirst({ where: { calendarFeedToken } })` works (consumed by Task 4; Task 5 queries by `id`). **Amended 2026-09-27 (user-approved, Path B):** NOT `@unique` — MongoDB unique indexes reject multiple nulls (lazy tokens keep nulls as the steady state) and Prisma 6.19.2 cannot express a partial/sparse unique index; uniqueness rests on `randomBytes(32)` entropy.

- [ ] **Step 1: Add the field to model `User`**

Insert after `preferredLocale String? @default("en")` (line 499):

```prisma
  calendarFeedToken String?
```

Also add a non-unique index in the same model, directly before `@@map("user")`:

```prisma
  @@index([calendarFeedToken])
```

- [ ] **Step 2: Validate the schema**

Run: `bunx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🪐`

- [ ] **Step 3: Regenerate the client and push to MongoDB**

Run: `bunx prisma generate`
Expected: `Generated Prisma Client (v6.19.2)` (or similar)

Run: `bunx prisma db push`
Expected: `🚀 Your database is already in sync with your Prisma schema.` (or a successful sync summary — it must NOT error). Requires `DATABASE_URL` in `.env`.

- [ ] **Step 4: Confirm typecheck still passes**

Run: `bun run typecheck`
Expected: exits 0 (no output).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add revocable calendarFeedToken field to User"
```

---

### Task 2: Pure ICS builder + tests

**Files:**
- Create: `lib/calendar/ics.ts`
- Test: `lib/calendar/ics.test.ts`

**Interfaces:**
- Consumes: nothing but the standard library (`TextEncoder`, `Date`).
- Produces: `IcsEventInput`, `escapeIcsText`, `sanitizeUri`, `formatIcsUtcDate`, `getFeedWindow`, `foldLine`, `buildIcs` — all consumed by Tasks 3 and 4.

- [ ] **Step 1: Write the failing test**

Create `lib/calendar/ics.test.ts`:

```ts
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
		// Only the VALARM's mandatory DESCRIPTION may appear; the optional event-level one must not.
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test lib/calendar/ics.test.ts`
Expected: FAIL — `error: Cannot find module "./ics"` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `lib/calendar/ics.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test lib/calendar/ics.test.ts`
Expected: `pass` with all 11 tests green, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/calendar/ics.ts lib/calendar/ics.test.ts
git commit -m "feat: add RFC 5545 ICS builder with folding, escaping and feed window"
```

---

### Task 3: Feed item mapper + tests

**Files:**
- Create: `lib/calendar/feedItems.ts`
- Test: `lib/calendar/feedItems.test.ts`

**Interfaces:**
- Consumes: `IcsEventInput` from `lib/calendar/ics.ts` (Task 2); `utcSlotToLocalDate` from `lib/calendar-utils.ts` (existing: `new Date(\`${dateStr}T${timeStr}:00Z\`)`); `EventType` from `@prisma/client`.
- Produces: `buildFeedItems(input)`, `FeedSlotRow`, `FeedEventRow`, `FeedMeetingLinkRow`, `FeedLabels` — consumed by Task 4.

- [ ] **Step 1: Write the failing test**

Create `lib/calendar/feedItems.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test lib/calendar/feedItems.test.ts`
Expected: FAIL — `error: Cannot find module "./feedItems"`.

- [ ] **Step 3: Write the implementation**

Create `lib/calendar/feedItems.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test lib/calendar/feedItems.test.ts`
Expected: `pass`, 5 tests green, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/calendar/feedItems.ts lib/calendar/feedItems.test.ts
git commit -m "feat: map booked slots and events to ICS feed items"
```

---

### Task 4: Rewrite the feed route

**Files:**
- Modify: `app/api/v1/calendar/ical/route.ts` (full rewrite, 57 lines today)

**Interfaces:**
- Consumes: `getFeedWindow`, `buildIcs` (Task 2); `buildFeedItems`, `FeedLabels` (Task 3); `prisma.user.findFirst({ where: { calendarFeedToken } })` (Task 1); `isLocale`/`DEFAULT_LOCALE` from `@/i18n/config`; `getServerTranslation` from `@/lib/notifications/locale`.
- Produces: `GET /api/v1/calendar/ical?token=<calendarFeedToken>` returning `text/calendar` (401 on missing/unknown token). Verified live in Task 8.

- [ ] **Step 1: Replace the route file**

Overwrite `app/api/v1/calendar/ical/route.ts` with:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildIcs, getFeedWindow } from "@/lib/calendar/ics";
import { buildFeedItems, type FeedLabels } from "@/lib/calendar/feedItems";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getServerTranslation } from "@/lib/notifications/locale";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	if (!token) {
		return NextResponse.json(
			{ success: false, error: "Token required" },
			{ status: 401 },
		);
	}

	const user = await prisma.user.findFirst({
		where: { calendarFeedToken: token },
		select: { id: true, preferredLocale: true },
	});
	if (!user) {
		return NextResponse.json(
			{ success: false, error: "Invalid token" },
			{ status: 401 },
		);
	}

	const { startDate, endDate } = getFeedWindow(new Date());

	const [slots, events, meetingLinks] = await Promise.all([
		prisma.slot.findMany({
			where: {
				bookedBy: user.id,
				date: { gte: startDate, lte: endDate },
			},
			orderBy: [{ date: "asc" }, { startTime: "asc" }],
		}),
		prisma.event.findMany({
			where: {
				date: { gte: startDate, lte: endDate },
				OR: [{ userId: user.id }, { type: "SPECIAL" }],
			},
			orderBy: [{ date: "asc" }, { time: "asc" }],
		}),
		prisma.meetingLink.findMany({
			where: {
				OR: [{ date: "DEFAULT" }, { date: { gte: startDate, lte: endDate } }],
			},
		}),
	]);

	const locale = isLocale(user.preferredLocale)
		? user.preferredLocale
		: DEFAULT_LOCALE;
	const t = (key: string) => getServerTranslation(locale, "calendar", key);
	const labels: FeedLabels = {
		BIBLE: await t("type.BIBLE"),
		PRAYER: await t("type.PRAYER"),
		PRAISE_WORSHIP: await t("type.PRAISE_WORSHIP"),
	};

	const ics = buildIcs(
		buildFeedItems({ slots, events, meetingLinks, labels }),
		new Date(),
	);

	return new NextResponse(ics, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Cache-Control": "private, max-age=1800",
			"Content-Disposition": 'inline; filename="tgaw-calendar.ics"',
		},
	});
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 3: Unit tests still green**

Run: `bun test lib/calendar`
Expected: 16 tests pass (11 from `ics.test.ts` + 5 from `feedItems.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add app/api/v1/calendar/ical/route.ts
git commit -m "feat: serve slots and events over a token-authenticated iCal feed"
```

---

### Task 5: Server actions for the feed token

**Files:**
- Create: `actions/calendarFeedActions.ts`

**Interfaces:**
- Consumes: session via `auth.api.getSession({ headers: await headers() })` (pattern from `actions/eventActions.ts`); `prisma.user` with `calendarFeedToken` (Task 1).
- Produces: `ensureCalendarFeedToken(): Promise<string>`, `regenerateCalendarFeedToken(): Promise<string>` — consumed by Task 7.

- [ ] **Step 1: Create the actions file**

Create `actions/calendarFeedActions.ts`:

```ts
"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

function newFeedToken(): string {
	return randomBytes(32).toString("base64url");
}

async function requireUserId(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session?.user?.id;
	if (!userId) throw new Error("Unauthorised");
	return userId;
}

/** Create the token on first use so users who never sync write nothing. */
export async function ensureCalendarFeedToken(): Promise<string> {
	const userId = await requireUserId();
	const existing = await prisma.user.findUnique({
		where: { id: userId },
		select: { calendarFeedToken: true },
	});
	if (existing?.calendarFeedToken) return existing.calendarFeedToken;

	const token = newFeedToken();
	await prisma.user.update({
		where: { id: userId },
		data: { calendarFeedToken: token },
	});
	return token;
}

/** Invalidate the previous link immediately and return the replacement. */
export async function regenerateCalendarFeedToken(): Promise<string> {
	const userId = await requireUserId();
	const token = newFeedToken();
	await prisma.user.update({
		where: { id: userId },
		data: { calendarFeedToken: token },
	});
	return token;
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add actions/calendarFeedActions.ts
git commit -m "feat: add server actions to ensure and regenerate the calendar feed token"
```

---

### Task 6: Translation keys (en, es, fr, pt)

**Files:**
- Modify: `messages/en/calendar.json`, `messages/es/calendar.json`, `messages/fr/calendar.json`, `messages/pt/calendar.json`

**Interfaces:**
- Produces: 31 flat `sync.*` keys consumed by `SyncCalendarDialog` in Task 7 via `useTranslation("calendar")`.

- [ ] **Step 1: Add the keys to `messages/en/calendar.json`**

Append inside the top-level object (keep the file flat, matching existing key style):

```json
  "sync.button": "Sync calendar",
  "sync.title": "Sync your calendar",
  "sync.description": "Subscribe from Google Calendar, Apple Calendar or Outlook. Your bookings and events stay up to date automatically.",
  "sync.urlLabel": "Subscription link",
  "sync.copy": "Copy",
  "sync.copied": "Copied",
  "sync.copyFailed": "Failed to copy",
  "sync.scheme": "Switch between the https:// and webcal:// link",
  "sync.regenerate": "Regenerate link",
  "sync.regenerateTitle": "Regenerate your subscription link?",
  "sync.regenerateDesc": "The current link stops working immediately. You will need to paste the new link into every calendar app you subscribed with.",
  "sync.regenerateConfirm": "Regenerate",
  "sync.regenerated": "New subscription link created",
  "sync.loadFailed": "Could not create your link. Try again.",
  "sync.loading": "Creating your secure link…",
  "sync.tabGoogle": "Google",
  "sync.tabApple": "Apple",
  "sync.tabOutlook": "Outlook",
  "sync.google.desc": "Subscribe from a computer:",
  "sync.google.step1": "Open calendar.google.com.",
  "sync.google.step2": "Next to Other calendars, press the + button and choose Subscribe to calendar.",
  "sync.google.step3": "Paste the link and press Add calendar.",
  "sync.apple.desc": "Subscribe on iPhone, iPad or Mac:",
  "sync.apple.step1": "iPhone/iPad: Settings → Calendar → Accounts → Add Account → Other → Subscribe to Calendar.",
  "sync.apple.step2": "Mac: File → New Calendar Subscription…",
  "sync.apple.step3": "Paste the link and press Subscribe.",
  "sync.outlook.desc": "Subscribe on the web or in the desktop app:",
  "sync.outlook.step1": "Outlook on the web: Add calendar → Subscribe from web.",
  "sync.outlook.step2": "Paste the link and press Import.",
  "sync.outlook.step3": "Desktop app: Add calendar → Subscribe from web, then paste the link.",
  "sync.note": "Your calendar app refreshes the feed automatically — changes appear within about 30 minutes."
```

- [ ] **Step 2: Add the same keys to `messages/es/calendar.json`**

```json
  "sync.button": "Sincronizar calendario",
  "sync.title": "Sincroniza tu calendario",
  "sync.description": "Suscríbete desde Google Calendar, Apple Calendar u Outlook. Tus reservas y eventos se mantienen al día automáticamente.",
  "sync.urlLabel": "Enlace de suscripción",
  "sync.copy": "Copiar",
  "sync.copied": "Copiado",
  "sync.copyFailed": "No se pudo copiar",
  "sync.scheme": "Alternar entre el enlace https:// y webcal://",
  "sync.regenerate": "Regenerar enlace",
  "sync.regenerateTitle": "¿Regenerar tu enlace de suscripción?",
  "sync.regenerateDesc": "El enlace actual dejará de funcionar inmediatamente. Tendrás que pegar el nuevo enlace en cada aplicación de calendario donde te hayas suscrito.",
  "sync.regenerateConfirm": "Regenerar",
  "sync.regenerated": "Nuevo enlace de suscripción creado",
  "sync.loadFailed": "No se pudo crear tu enlace. Inténtalo de nuevo.",
  "sync.loading": "Creando tu enlace seguro…",
  "sync.tabGoogle": "Google",
  "sync.tabApple": "Apple",
  "sync.tabOutlook": "Outlook",
  "sync.google.desc": "Suscríbete desde un ordenador:",
  "sync.google.step1": "Abre calendar.google.com.",
  "sync.google.step2": "Junto a «Otros calendarios», pulsa el botón + y elige «Suscribirse al calendario».",
  "sync.google.step3": "Pega el enlace y pulsa «Añadir calendario».",
  "sync.apple.desc": "Suscríbete en iPhone, iPad o Mac:",
  "sync.apple.step1": "iPhone/iPad: Ajustes → Calendario → Cuentas → Añadir cuenta → Otro → Suscribirse al calendario.",
  "sync.apple.step2": "Mac: Archivo → Nuevo calendario suscrito…",
  "sync.apple.step3": "Pega el enlace y pulsa «Suscribirse».",
  "sync.outlook.desc": "Suscríbete en la web o en la aplicación de escritorio:",
  "sync.outlook.step1": "Outlook en la web: Añadir calendario → Suscribirse desde la web.",
  "sync.outlook.step2": "Pega el enlace y pulsa «Importar».",
  "sync.outlook.step3": "Aplicación de escritorio: Añadir calendario → Suscribirse desde la web y pega el enlace.",
  "sync.note": "Tu aplicación de calendario actualiza la suscripción automáticamente: los cambios aparecen en unos 30 minutos."
```

- [ ] **Step 3: Add the same keys to `messages/fr/calendar.json`**

```json
  "sync.button": "Synchroniser le calendrier",
  "sync.title": "Synchronisez votre calendrier",
  "sync.description": "Abonnez-vous depuis Google Calendar, Apple Calendar ou Outlook. Vos réservations et événements restent à jour automatiquement.",
  "sync.urlLabel": "Lien d'abonnement",
  "sync.copy": "Copier",
  "sync.copied": "Copié",
  "sync.copyFailed": "Échec de la copie",
  "sync.scheme": "Basculer entre le lien https:// et webcal://",
  "sync.regenerate": "Régénérer le lien",
  "sync.regenerateTitle": "Régénérer votre lien d'abonnement ?",
  "sync.regenerateDesc": "Le lien actuel cessera immédiatement de fonctionner. Vous devrez coller le nouveau lien dans chaque application de calendrier où vous êtes abonné.",
  "sync.regenerateConfirm": "Régénérer",
  "sync.regenerated": "Nouveau lien d'abonnement créé",
  "sync.loadFailed": "Impossible de créer votre lien. Réessayez.",
  "sync.loading": "Création de votre lien sécurisé…",
  "sync.tabGoogle": "Google",
  "sync.tabApple": "Apple",
  "sync.tabOutlook": "Outlook",
  "sync.google.desc": "Abonnez-vous depuis un ordinateur :",
  "sync.google.step1": "Ouvrez calendar.google.com.",
  "sync.google.step2": "À côté d'« Autres calendriers », cliquez sur + puis choisissez « S'abonner au calendrier ».",
  "sync.google.step3": "Collez le lien et cliquez sur « Ajouter le calendrier ».",
  "sync.apple.desc": "Abonnez-vous sur iPhone, iPad ou Mac :",
  "sync.apple.step1": "iPhone/iPad : Réglages → Calendrier → Comptes → Ajouter un compte → Autre → S'abonner au calendrier.",
  "sync.apple.step2": "Mac : Fichier → Nouveau calendrier par abonnement…",
  "sync.apple.step3": "Collez le lien et cliquez sur « S'abonner ».",
  "sync.outlook.desc": "Abonnez-vous sur le web ou dans l'application de bureau :",
  "sync.outlook.step1": "Outlook sur le web : Ajouter un calendrier → S'abonner via le web.",
  "sync.outlook.step2": "Collez le lien et cliquez sur « Importer ».",
  "sync.outlook.step3": "Application de bureau : Ajouter un calendrier → S'abonner via le web, puis collez le lien.",
  "sync.note": "Votre application de calendrier rafraîchit le flux automatiquement — les changements apparaissent dans les 30 minutes environ."
```

- [ ] **Step 4: Add the same keys to `messages/pt/calendar.json`**

```json
  "sync.button": "Sincronizar calendário",
  "sync.title": "Sincronize o seu calendário",
  "sync.description": "Subscreva no Google Calendar, Apple Calendar ou Outlook. As suas reservas e eventos mantêm-se atualizados automaticamente.",
  "sync.urlLabel": "Ligação de subscrição",
  "sync.copy": "Copiar",
  "sync.copied": "Copiado",
  "sync.copyFailed": "Falha ao copiar",
  "sync.scheme": "Alternar entre a ligação https:// e webcal://",
  "sync.regenerate": "Gerar nova ligação",
  "sync.regenerateTitle": "Gerar uma nova ligação de subscrição?",
  "sync.regenerateDesc": "A ligação atual deixa de funcionar imediatamente. Terá de colar a nova ligação em cada aplicação de calendário onde se subscreveu.",
  "sync.regenerateConfirm": "Gerar",
  "sync.regenerated": "Nova ligação de subscrição criada",
  "sync.loadFailed": "Não foi possível criar a sua ligação. Tente novamente.",
  "sync.loading": "A criar a sua ligação segura…",
  "sync.tabGoogle": "Google",
  "sync.tabApple": "Apple",
  "sync.tabOutlook": "Outlook",
  "sync.google.desc": "Subscreva a partir de um computador:",
  "sync.google.step1": "Abra calendar.google.com.",
  "sync.google.step2": "Junto a «Outros calendários», carregue no botão + e escolha «Subscrever calendário».",
  "sync.google.step3": "Cole a ligação e carregue em «Adicionar calendário».",
  "sync.apple.desc": "Subscreva no iPhone, iPad ou Mac:",
  "sync.apple.step1": "iPhone/iPad: Definições → Calendário → Contas → Adicionar conta → Outro → Subscrever calendário.",
  "sync.apple.step2": "Mac: Ficheiro → Novo calendário por subscrição…",
  "sync.apple.step3": "Cole a ligação e carregue em «Subscrever».",
  "sync.outlook.desc": "Subscreva na web ou na aplicação de desktop:",
  "sync.outlook.step1": "Outlook na web: Adicionar calendário → Subscrever na web.",
  "sync.outlook.step2": "Cole a ligação e carregue em «Importar».",
  "sync.outlook.step3": "Aplicação de desktop: Adicionar calendário → Subscrever na web e cole a ligação.",
  "sync.note": "A sua aplicação de calendário atualiza o fluxo automaticamente — as alterações surgem em cerca de 30 minutos."
```

- [ ] **Step 5: Verify translation parity**

Run: `bun run i18n:check`
Expected: exit 0, no missing keys (warnings about extra keys or interpolation mismatches must be absent too — this plan adds none).

- [ ] **Step 6: Commit**

```bash
git add messages/en/calendar.json messages/es/calendar.json messages/fr/calendar.json messages/pt/calendar.json
git commit -m "feat: add sync.* calendar translations for en, es, fr and pt"
```

---

### Task 7: Sync dialog UI + page wiring

**Files:**
- Create: `components/calendar/sync-calendar-dialog.tsx`
- Modify: `app/(dashboard)/calendar/page.tsx:7` (import), `:169-179` (header block)
- Delete: `components/calendar/ical-copy-button.tsx`

**Interfaces:**
- Consumes: `ensureCalendarFeedToken`, `regenerateCalendarFeedToken` (Task 5); `sync.*` translation keys (Task 6); shadcn `Dialog`, `AlertDialog`, `Tabs`, `Input`, `Label`, `Separator`, `Skeleton`, `Button`; `buttonVariants` from `@/components/ui/button`; `toast` from `sonner`.
- Produces: `SyncCalendarDialog()` (no props) — rendered by the calendar page.

- [ ] **Step 1: Create the dialog component**

Create `components/calendar/sync-calendar-dialog.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	ensureCalendarFeedToken,
	regenerateCalendarFeedToken,
} from "@/actions/calendarFeedActions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SyncCalendarDialog() {
	const { t } = useTranslation("calendar");
	const { t: tc } = useTranslation("common");
	const [open, setOpen] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [webcal, setWebcal] = useState(false);
	const [copied, setCopied] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [regenerating, setRegenerating] = useState(false);

	useEffect(() => {
		if (!open || token) return;
		let cancelled = false;
		async function run() {
			setLoading(true);
			try {
				const next = await ensureCalendarFeedToken();
				if (!cancelled) setToken(next);
			} catch {
				if (!cancelled) toast.error(t("sync.loadFailed"));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [open, token, t]);

	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const httpsUrl = token
		? `${origin}/api/v1/calendar/ical?token=${token}`
		: "";
	const url = webcal ? httpsUrl.replace(/^https:/, "webcal:") : httpsUrl;

	const handleCopy = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success(t("sync.copied"));
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error(t("sync.copyFailed"));
		}
	};

	const handleRegenerate = async () => {
		setRegenerating(true);
		try {
			const next = await regenerateCalendarFeedToken();
			setToken(next);
			toast.success(t("sync.regenerated"));
		} catch {
			toast.error(t("sync.loadFailed"));
		} finally {
			setRegenerating(false);
			setConfirmOpen(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="cursor-pointer shrink-0"
					>
						<Calendar className="size-4" aria-hidden="true" />
						{t("sync.button")}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("sync.title")}</DialogTitle>
						<DialogDescription>{t("sync.description")}</DialogDescription>
					</DialogHeader>

					{loading || !token ? (
						<div className="flex flex-col gap-2" aria-busy="true">
							<Skeleton className="h-4 w-1/3" />
							<Skeleton className="h-9 w-full" />
						</div>
					) : (
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="calendar-feed-url">
									{t("sync.urlLabel")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										id="calendar-feed-url"
										readOnly
										value={url}
										className="min-w-0 flex-1 font-mono text-xs"
										onFocus={(event) => event.target.select()}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="cursor-pointer"
										aria-label={t("sync.scheme")}
										onClick={() => setWebcal((value) => !value)}
									>
										{webcal ? "webcal://" : "https://"}
									</Button>
									<Button
										type="button"
										size="sm"
										className="cursor-pointer"
										onClick={handleCopy}
										aria-label={t("sync.copy")}
									>
										{copied ? (
											<Check className="size-3.5" aria-hidden="true" />
										) : (
											<Copy className="size-3.5" aria-hidden="true" />
										)}
										{copied ? t("sync.copied") : t("sync.copy")}
									</Button>
								</div>
							</div>

							<Separator />

							<Tabs defaultValue="google" className="w-full">
								<TabsList className="w-full">
									<TabsTrigger value="google">{t("sync.tabGoogle")}</TabsTrigger>
									<TabsTrigger value="apple">{t("sync.tabApple")}</TabsTrigger>
									<TabsTrigger value="outlook">
										{t("sync.tabOutlook")}
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="google"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.google.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.google.step1")}</li>
										<li>{t("sync.google.step2")}</li>
										<li>{t("sync.google.step3")}</li>
									</ol>
								</TabsContent>
								<TabsContent
									value="apple"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.apple.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.apple.step1")}</li>
										<li>{t("sync.apple.step2")}</li>
										<li>{t("sync.apple.step3")}</li>
									</ol>
								</TabsContent>
								<TabsContent
									value="outlook"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.outlook.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.outlook.step1")}</li>
										<li>{t("sync.outlook.step2")}</li>
										<li>{t("sync.outlook.step3")}</li>
									</ol>
								</TabsContent>
							</Tabs>

							<p className="text-xs text-muted-foreground">{t("sync.note")}</p>

							<div className="flex justify-end">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="cursor-pointer text-destructive hover:text-destructive"
									onClick={() => setConfirmOpen(true)}
								>
									<RefreshCw className="size-3.5" aria-hidden="true" />
									{t("sync.regenerate")}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("sync.regenerateTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("sync.regenerateDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("action.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className={buttonVariants({ variant: "destructive" })}
							disabled={regenerating}
							onClick={(event) => {
								event.preventDefault();
								void handleRegenerate();
							}}
						>
							{t("sync.regenerateConfirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
```

- [ ] **Step 2: Wire it into the calendar page**

In `app/(dashboard)/calendar/page.tsx`, replace line 7:

```tsx
import { IcalCopyButton } from "@/components/calendar/ical-copy-button";
```

with:

```tsx
import { SyncCalendarDialog } from "@/components/calendar/sync-calendar-dialog";
```

Then replace the header block (lines 169-179):

```tsx
		return (
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:p-6">
					<div>
						<h1 className="text-2xl">{pageTitle}</h1>
						<p className="text-muted-foreground">
							{pageSubtitle}
						</p>
					</div>
					<IcalCopyButton token={session.user.id} />
				</div>
```

with:

```tsx
		return (
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
					<div>
						<h1 className="text-2xl">{pageTitle}</h1>
						<p className="text-muted-foreground">
							{pageSubtitle}
						</p>
					</div>
					<SyncCalendarDialog />
				</div>
```

- [ ] **Step 3: Delete the superseded component**

Run: `rm components/calendar/ical-copy-button.tsx`

Verify no references remain:

Run: `grep -rn "IcalCopyButton\|ical-copy-button" app components actions lib`
Expected: no output.

- [ ] **Step 4: Typecheck + lint**

Run: `bun run typecheck`
Expected: exits 0.

Run: `bun run lint`
Expected: exits 0 (if the repo reports pre-existing errors in unrelated files, confirm none of them are in the files touched by this plan).

- [ ] **Step 5: Commit**

```bash
git add components/calendar/sync-calendar-dialog.tsx "app/(dashboard)/calendar/page.tsx" components/calendar/ical-copy-button.tsx
git commit -m "feat: add sync calendar dialog with platform instructions"
```

---

### Task 8: End-to-end verification

**Files:** none created — verification only.

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: a green verification record; fixes (if any) committed with `fix:` commits.

- [ ] **Step 1: Full unit suite**

Run: `bun test`
Expected: all tests pass, `fail 0` (existing suites plus the 16 new ones).

- [ ] **Step 2: Typecheck, lint, translations**

Run: `bun run typecheck && bun run lint && bun run i18n:check`
Expected: typecheck exit 0, i18n:check OK, lint shows no NEW errors vs the pre-existing baseline (19 errors / 20 warnings, all in files unrelated to this plan — `bun run lint` does NOT exit 0 by design); every file touched by this plan must be lint-clean.

- [ ] **Step 3: Start the dev server**

Run: `bun run dev`
Expected: server listening (custom `server.ts` wrapper) on `http://localhost:3000`.

- [ ] **Step 4: Exercise the UI**

In a browser: log in → open `/calendar` → click **Sync calendar**.
Expected:
- The dialog opens with a skeleton, then shows a `https://…/api/v1/calendar/ical?token=<43-char base64url>` URL.
- The scheme toggle flips the field between `https://` and `webcal://`.
- Copy shows a "Copied" toast and writes the URL to the clipboard.
- Tabs switch between Google / Apple / Outlook instructions.
- Switch the UI language to `es`, `fr`, `pt` and confirm the dialog copy translates (cookie-driven locale).

- [ ] **Step 5: Fetch and inspect the feed**

Copy the URL from the dialog, then:

```bash
curl -s -D - "<COPIED_URL>" -o /tmp/tgaw.ics
head -30 /tmp/tgaw.ics
```

Expected headers: `content-type: text/calendar; charset=utf-8` and `cache-control: private, max-age=1800`.
Expected body: starts `BEGIN:VCALENDAR`, contains `UID:slot-…@tgaw` / `UID:event-…@tgaw`, `DTSTART:…Z` (UTC), `BEGIN:VALARM`, ends `END:VCALENDAR`, uses CRLF line endings.

- [ ] **Step 6: Verify auth failures**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/v1/calendar/ical"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/v1/calendar/ical?token=not-a-real-token"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/v1/calendar/ical?token=<OLD_TOKEN_FROM_STEP_5>"
```

Expected: `401`, `401`, `401` — the third proves **Regenerate** invalidated the previous link (click Regenerate in the dialog first, then re-run with the old token).

- [ ] **Step 7: Verify Google-style validation (offline)**

Run: `python3 -c "import sys;d=open('/tmp/tgaw.ics').read();assert d.startswith('BEGIN:VCALENDAR');assert d.rstrip().endswith('END:VCALENDAR');assert d.count('BEGIN:VEVENT')==d.count('END:VEVENT');print('structure OK, VEVENTs:', d.count('BEGIN:VEVENT'))"`
Expected: `structure OK, VEVENTs: <n>` where n = your booked slots + visible events in the window.

- [ ] **Step 8: Commit any fixes, then final green run**

```bash
git add <only files changed by fixes>
git commit -m "fix: <describe anything found in verification>"
bun test && bun run typecheck && bun run lint && bun run i18n:check
```
Expected: tests + typecheck + i18n all green; lint at pre-existing baseline only (no new errors in plan-touched files).

---

## Self-Review notes

- **Spec coverage:** dialog + webcal + platform instructions (Task 7, keys Task 6) ✓; page-mirroring feed content (Task 4 queries match `app/(dashboard)/calendar/page.tsx:90-128`) ✓; revocable token + regenerate (Tasks 1, 5, 7) ✓; rolling 30d/12mo window (Task 2 `getFeedWindow`, Task 4) ✓; UTC times, UID/DTSTAMP/SEQUENCE/STATUS/VALARM, escaping, folding, headers (Task 2, 4) ✓; i18n for all four locales (Task 6) ✓; legacy `EventBooking` removed from the feed (old route overwritten in Task 4) ✓.
- **Type consistency:** `IcsEventInput`, `buildFeedItems`, `FeedLabels`, `ensureCalendarFeedToken`, `regenerateCalendarFeedToken`, `SyncCalendarDialog` are each defined once and referenced identically in every consuming task.
- **No placeholders:** every step carries complete code, exact paths and exact commands.
