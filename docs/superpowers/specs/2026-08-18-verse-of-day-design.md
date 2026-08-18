# Verse of the Day — Design

**Date:** 2026-08-18
**Status:** Approved

## Goal

Provide a daily scripture (Verse of the Day) that is:
1. Served by a **public** API endpoint (`GET /api/v1/verse/today`) for reuse (mobile clients, landing page).
2. Displayed as a card **directly after the stat cards** on `/overview`.
3. Shareable to popular social platforms via a share dialog whose shared link lands on a dedicated public route (`/verse/today`).

## Approach

Static curated verse list + pure resolver + thin public API + public `/verse/today` page.

- Verse content lives in a curated in-app array (`lib/data/verses.ts`), no DB, no external dependency.
- A pure resolver (`lib/services/verseService.ts`) picks the verse deterministically by UTC day-of-year, cycling when the list is shorter than 366 entries.
- The API route wraps the resolver in the standard `{ success, data, error }` envelope.
- The `/overview` card and the `/verse/today` page read the **same resolver** directly (server-side), so there is no client fetch, skeleton, or loading state on the overview.
- The Share dialog opens social share intents pointing at `{NEXT_PUBLIC_APP_URL}/verse/today`.

## Data Model

No Prisma/Zod schema changes. Verse entries are a plain typed array.

### `lib/data/verses.ts`

```ts
export interface Verse {
  text: string
  reference: string
}

export const VERSES: Verse[] = [
  { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  // ...curated set
]
```

Start with a solid curated set (dozens of verses covering both Testaments and devotional themes). The resolver handles any list length by cycling.

## Service Layer — `lib/services/verseService.ts`

```ts
import { VERSES, type Verse } from "@/lib/data/verses"

export interface VerseOfDay extends Verse {
  date: string      // YYYY-MM-DD (UTC)
  dayOfYear: number // 1-366 (1-indexed)
}

export function getVerseOfDay(dateStr?: string): VerseOfDay
```

- Defaults to today's UTC date (`new Date().toISOString().split("T")[0]`).
- `dayOfYear` = index of the date in its year (1-indexed), computed from the UTC date.
- `verse = VERSES[(dayOfYear - 1) % VERSES.length]`.
- Pure, deterministic, timezone-safe (UTC), consistent with the app's slot/date handling.

## API Route — `app/api/v1/verse/today/route.ts`

Public `GET` (no session required):

```json
{ "success": true, "data": { "text": "...", "reference": "Philippians 4:13", "date": "2026-08-18", "dayOfYear": 230 } }
```

Standard envelope, no Zod validation needed (no inputs). Errors wrapped with the existing `{ success, error }` shape.

## Public Page — `app/(public)/verse/today/page.tsx`

New route group `app/(public)/verse/today/` placed **outside** the `(dashboard)` shell so it renders as a standalone public page (no sidebar/topbar).

- Server component: reads `getVerseOfDay()` directly.
- Centered hero layout: book icon, verse text, reference, "Verse of the Day" badge, and a "Share" button.
- The "Share" button opens the same `VerseShareDialog`.

## Overview Card — `components/verse/VerseCard.tsx`

Server component. Placed **directly after the 4 stat cards** on `/overview`, before the agenda grid.

Structure:
- `Card` with `CardHeader`/`CardContent` using shadcn semantic tokens (`bg-background`, `border-border`, `text-muted-foreground`, `bg-muted`, etc.).
- `BookOpen` Lucide icon (replaces the 📖 emoji).
- Verse text in quotes.
- `Badge` for "Verse of the Day".
- shadcn `Button` "Share" → opens the share dialog.
- Reads `getVerseOfDay()` server-side; no client fetch.

## Share Dialog — `components/verse/VerseShareDialog.tsx`

Client component (`"use client"`), triggered by the Share button.

- shadcn `Dialog` with a list of share options:
  - **WhatsApp** — `https://wa.me/?text=<text>`
  - **Facebook** — `https://www.facebook.com/sharer/sharer.php?u=<url>`
  - **X / Twitter** — `https://twitter.com/intent/tweet?text=<text>&url=<url>`
  - **Telegram** — `https://t.me/share/url?url=<url>&text=<text>`
  - **Copy** — copies `text + ref + url` to clipboard, shows a `sonner` toast.
- Shared text = `"I can do all things through Christ who strengthens me." — Philippians 4:13`.
- Shared URL = `${NEXT_PUBLIC_APP_URL}/verse/today`.
- Each social option opens its share intent in a new tab (`target="_blank"`, `rel="noreferrer"`).
- Uses existing shadcn primitives (Dialog, Button, icons with `aria-hidden`).

## Files Created

| File | Type | Purpose |
|------|------|---------|
| `lib/data/verses.ts` | data | Curated verse array + `Verse` type |
| `lib/services/verseService.ts` | service | `getVerseOfDay()` resolver |
| `app/api/v1/verse/today/route.ts` | API | Public `GET` endpoint |
| `app/(public)/verse/today/page.tsx` | page | Public share landing page |
| `components/verse/VerseCard.tsx` | component | Overview card (server) |
| `components/verse/VerseShareDialog.tsx` | component | Share dialog (client) |

## Files Modified

| File | Change |
|------|--------|
| `app/(dashboard)/overview/page.tsx` | Render `<VerseCard />` directly after the stat cards |

## Error Handling

- `verseService` is pure — no DB/network failures.
- API wraps unexpected errors in the standard envelope (defensive try/catch).
- Share dialog Copy uses `sonner` toast for success feedback.

## Testing

- Unit test (optional, via `bun test`): `getVerseOfDay` determinism — same date → same verse; different dates within a year → different verses (when list < 366); cycling at year boundary.
- Manual: `/overview` shows the verse card after stat cards; `/api/v1/verse/today` returns the envelope; `/verse/today` renders standalone; Share dialog opens each platform intent with the correct text + URL.
- `bun run typecheck` after implementation.

## Out of Scope

- Admin editing of verses (future; would need a DB model).
- Personalized/rotation-random verses (deterministic rotation only).
- Native mobile deep links.