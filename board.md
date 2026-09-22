# Board Dashboard — Executive Stats Section

Add a **full executive overview** stats section to the Board Dashboard using the `@blocks-so/stats-11` shadcn block. This sits **below** the existing 4 stat cards + progress bar, providing deeper quota/usage-style insights with progress bars and trend indicators.

---

## User Review Required

> [!IMPORTANT]
> The stats-11 block will be installed via `npx shadcn@latest add @blocks-so/stats-11`. This adds new component files to `components/ui/` (or a `blocks/` directory). I will adapt the generated component to use our existing shadcn tokens and i18n system.

> [!IMPORTANT]
> The configurable time range (weekly vs monthly) requires a **client component** for the stats section with data fetched from a new API endpoint. The existing server-rendered stat cards above remain untouched.

---

## Proposed Changes

### 1. Install the shadcn block

Run:

```bash
bunx --bun shadcn@latest add @blocks-so/stats-11
```

This installs the Stats 11 block (quota/usage card with progress bars). We'll inspect the generated component and adapt it to our design system.

---

### 2. New API Endpoint

#### [NEW] [`route.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/admin/board-stats/route.ts)

A `GET` endpoint at `/api/v1/admin/board-stats?range=week|month` that returns all 6 metrics with current values, previous-period values, and % change.

**Auth**: Requires session with role `board`, `leader`, or `superadmin`.

**Query params**:

- `range` — `"week"` (default) or `"month"`

**Response shape**:

```json
{
  "success": true,
  "data": {
    "range": "week",
    "memberGrowth": {
      "current": 12,
      "previous": 8,
      "total": 247,
      "change": 50
    },
    "slotFillRate": {
      "bible": {
        "filled": 42,
        "total": 48,
        "rate": 87.5,
        "previousRate": 81.2,
        "change": 7.8
      },
      "prayer": {
        "filled": 38,
        "total": 48,
        "rate": 79.2,
        "previousRate": 75.0,
        "change": 5.6
      },
      "worship": {
        "filled": 25,
        "total": 48,
        "rate": 52.1,
        "previousRate": 48.3,
        "change": 7.9
      }
    },
    "communityActivity": {
      "current": 34,
      "previous": 28,
      "change": 21.4
    },
    "moderationHealth": {
      "open": 3,
      "resolved": 12,
      "total": 15,
      "resolutionRate": 80.0,
      "previousResolutionRate": 72.0,
      "change": 11.1
    },
    "activeUsers": {
      "current": 89,
      "total": 247,
      "rate": 36.0,
      "previousRate": 31.2,
      "change": 15.4
    },
    "messagesSent": {
      "current": 156,
      "previous": 121,
      "change": 28.9
    }
  }
}
```

**Prisma queries** (all scoped to the selected date range):

| Metric                 | Query                                                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Member Growth**      | `prisma.user.count({ where: { createdAt: { gte: periodStart } } })` for current and previous windows. Total = `prisma.user.count({ where: { banned: { not: true } } })`                                                                                                           |
| **Slot Fill Rate**     | `prisma.slot.count({ where: { type, date: { gte, lte }, bookedBy: { not: null } } })` per channel (BIBLE, PRAYER, PRAISE_WORSHIP) for both periods. Total = `prisma.slot.count({ where: { type, date: { gte, lte } } })`                                                          |
| **Community Activity** | `prisma.post.count({ where: { createdAt: { gte: periodStart, lte: periodEnd } } })` for both periods                                                                                                                                                                              |
| **Moderation Health**  | `prisma.report.count({ where: { status: "OPEN" } })`, `prisma.report.count({ where: { status: "RESOLVED", createdAt: { gte } } })`                                                                                                                                                |
| **Active Users**       | `prisma.slot.findMany({ where: { bookedBy: { not: null }, date: { gte, lte } }, select: { bookedBy: true }, distinct: ['bookedBy'] })` + `prisma.post.findMany({ where: { createdAt: { gte, lte } }, select: { authorId: true }, distinct: ['authorId'] })` → union of unique IDs |
| **Messages Sent**      | `prisma.message.count({ where: { createdAt: { gte, lte } } })` for both periods                                                                                                                                                                                                   |

---

### 3. Client Component for Stats Section

#### [NEW] [`BoardExecutiveStats.tsx`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/board/BoardExecutiveStats.tsx)

A `"use client"` component that:

1. Renders a **weekly / monthly toggle** (using shadcn `Tabs` or segmented `ToggleGroup`).
2. Fetches data from `/api/v1/admin/board-stats?range=week|month` on mount and on toggle change.
3. Shows **skeleton loaders** while fetching.
4. Renders **6 quota-style stat cards** using the stats-11 block layout — each card contains:
   - **Title** + Lucide icon
   - **Primary value** (bold number or percentage)
   - **Progress bar** (filled / total where applicable)
   - **Trend badge** — `↑ 12.5%` in green or `↓ 5.2%` in red (vs. previous period)
   - **Sub-description** text

The 6 cards:

| #   | Card Title                 | Icon            | Primary Value  | Progress Bar                    | Trend Source                    |
| --- | -------------------------- | --------------- | -------------- | ------------------------------- | ------------------------------- |
| 1   | **Member Growth**          | `UserPlus`      | `+12 new`      | current / total members         | vs. previous period new signups |
| 2   | **Bible Slot Fill Rate**   | `BookOpen`      | `87.5%`        | filled / total slots            | vs. previous period rate        |
| 3   | **Prayer Slot Fill Rate**  | `HandHeart`     | `79.2%`        | filled / total slots            | vs. previous period rate        |
| 4   | **Worship Slot Fill Rate** | `Music`         | `52.1%`        | filled / total slots            | vs. previous period rate        |
| 5   | **Community Posts**        | `Megaphone`     | `34 posts`     | current / previous (comparison) | % change                        |
| 6   | **Moderation Health**      | `ShieldCheck`   | `80% resolved` | resolved / total                | vs. previous resolution rate    |
| 7   | **Active Users**           | `Activity`      | `89 active`    | active / total members          | vs. previous period rate        |
| 8   | **Messages Sent**          | `MessageSquare` | `156 messages` | current / previous (comparison) | % change                        |

Layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — 4 cards per row on desktop.

---

### 4. Wire into Board Page

#### [MODIFY] [`page.tsx`](<file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(dashboard)/board/page.tsx>)

- Import and render `<BoardExecutiveStats />` **below** the existing progress bar `<Card>`.
- Add a new section heading: "Executive Insights" with a `BarChart3` icon.
- Keep the existing server-rendered cards untouched.

---

### 5. i18n Translations

#### [MODIFY] [`admin.json`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/messages/en/admin.json) (and `es/`, `fr/`, `pt/` equivalents)

New keys under the `board.stats.*` namespace:

```json
{
  "board.stats.title": "Executive Insights",
  "board.stats.description": "organization-wide performance metrics with period-over-period trends.",
  "board.stats.weekly": "This Week",
  "board.stats.monthly": "This Month",
  "board.stats.memberGrowth": "Member Growth",
  "board.stats.memberGrowthDesc": "new members joined",
  "board.stats.memberGrowthTotal": "of {{total}} total members",
  "board.stats.bibleFillRate": "Bible Slot Fill Rate",
  "board.stats.prayerFillRate": "Prayer Slot Fill Rate",
  "board.stats.worshipFillRate": "Worship Slot Fill Rate",
  "board.stats.fillRateDesc": "{{filled}} of {{total}} slots filled",
  "board.stats.communityPosts": "Community Posts",
  "board.stats.communityPostsDesc": "posts published this period",
  "board.stats.moderationHealth": "Moderation Health",
  "board.stats.moderationDesc": "{{resolved}} of {{total}} reports resolved",
  "board.stats.activeUsers": "Active Users",
  "board.stats.activeUsersDesc": "{{active}} of {{total}} members active",
  "board.stats.messagesSent": "Messages Sent",
  "board.stats.messagesDesc": "messages sent this period",
  "board.stats.vsLastPeriod": "vs last {{period}}",
  "board.stats.noData": "No data available for this period"
}
```

---

### 6. Zod Schema for API Validation

#### [NEW] [`boardStatsSchema.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/schemas/boardStatsSchema.ts)

```typescript
import { z } from "zod"

export const boardStatsQuerySchema = z.object({
  range: z.enum(["week", "month"]).default("week"),
})

export type BoardStatsQuery = z.infer<typeof boardStatsQuerySchema>
```

---

## File Summary

| Action      | File                                       | Description                                            |
| ----------- | ------------------------------------------ | ------------------------------------------------------ |
| **INSTALL** | `@blocks-so/stats-11`                      | shadcn block — quota/usage card with progress bars     |
| **NEW**     | `app/api/v1/admin/board-stats/route.ts`    | API endpoint for all 8 executive metrics               |
| **NEW**     | `components/board/BoardExecutiveStats.tsx` | Client component — toggle + 8 stat cards               |
| **NEW**     | `lib/schemas/boardStatsSchema.ts`          | Zod query validation                                   |
| **MODIFY**  | `app/(dashboard)/board/page.tsx`           | Wire in `<BoardExecutiveStats />` below existing cards |
| **MODIFY**  | `messages/{en,es,fr,pt}/admin.json`        | Add `board.stats.*` translation keys                   |

---

## Verification Plan

### Automated

```bash
bun run check        # Biome lint + format
bunx tsc --noEmit    # Type check
```

### Manual

1. Navigate to `/board` as a `board`-role user → verify existing cards still render.
2. Verify the new "Executive Insights" section appears below with 8 cards.
3. Toggle between "This Week" and "This Month" → verify data refreshes.
4. Verify trend badges show correct direction (↑/↓) and color (green/red).
5. Verify progress bars accurately reflect fill rates.
6. Verify skeleton loading states appear during fetch.
7. Test responsiveness: 1-col on mobile, 2-col on tablet, 4-col on desktop.
8. Verify API returns 401 for unauthenticated users and 403 for `member`/`coordinator` roles.
