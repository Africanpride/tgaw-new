# Devotion Pages Premium Pass — Design

**Date**: 2026-08-21
**Scope**: `/bible`, `/prayer`, `/worship` UI/UX overhaul (all 7 approved improvements)
**Out of scope**: Notification fan-out wiring (deferred — Settings page already stores
per-user email/push preference maps via `settingsActions`; the future dispatcher must
respect them). Reading-tracker / streak features.

## 1. Shared page shell

New server component `components/booking/DevotionPage.tsx`. Owns session fetch,
data loading (`getSlotsForDate`, new stats, active hosts), and full layout.
The three route files become ~25-line config wrappers:

```ts
<DevotionPage
  type="PRAYER" basePath="/prayer"
  title="Prayer Watch" description="..."
  icon={Church} slotNoun="prayer" roomLabel="Prayer Room"
/>
```

Guarantees cross-page consistency; changes land in one place.

## 2. Honest stats

New pure helper `computeSlotStats(slots, today)` + service wrapper
`getUserSlotStats(userId)` (TDD). Counts booked slots per type:

- **Sessions This Week** (calendar week, Monday start, UTC date strings)
- **Sessions This Month** (calendar month)
- **Time This Month** (month sessions × 30 min → "Xh Ym")

"Chapters Completed" and "Consistency Rate" are dropped — not derivable from
stored data; fake zeros fail the premium bar.

## 3. Page header

Accent icon tile (`accent.iconTile`) + h1 title + one-line description above
the stat row.

## 4. DateNav v2

Client component upgrade: relative labels (Today / Tomorrow / weekday),
a "Today" reset chip when viewing another day, and a `<Popover>` + `<Calendar>`
date picker for month jumps. Remains URL-driven (`?date=`).

## 5. My Devotion Bookings

Purpose-built client component `MyDevotionBookings` (not `MyBookingsStack`,
which is designed for `/booking`'s mixed-type context):

- Status badges: **Live now** (pulsing dot) / Upcoming / Done
- Notes display (own booking context)
- Cancel: `AlertDialog` confirm → existing `cancelSlotAction` → toast +
  revalidation (action already revalidates all devotion paths)
- Join button only while the user's slot is live AND a meeting link exists
- Illustrated empty state with CTA into `/booking?type=X`
- `DisplacedBookingNotice` stays pinned above bookings

## 6. Meeting Links card

Upgrade existing `MeetingLinkCard`: replace hardcoded "Live" badge with an
honest `hostName`/live prop; swap banned `window.open` for `<Button asChild>` +
anchor; add host line ("Live now · hosted by X") from `getActiveSlotHosts`
(today only); nicer empty state when no link.

## 7. Motion

`FadeIn` client wrapper (motion/react fade-up, ~60 ms stagger between sections),
`useReducedMotion` respected. Server pages remain server components.

## Verification

Unit tests for stats computation · `bun test` · `tsc --noEmit` · lint · build ·
manual smoke of book/cancel/join flows.
