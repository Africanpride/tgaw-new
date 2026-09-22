# Coordinator Dashboard — Full Operational Upgrade

Transform the coordinator dashboard from a bare-bones 4-card stat page into a **premium, operational dashboard** with timezone-scoped metrics, trends, coverage gap detection, user activity tracking, a recent bookings feed, slot assignment, and a live timeline — matching the quality bar of the Board dashboard's `BoardExecutiveStats`.

---

## User Review Required

> [!IMPORTANT]
> This is a **comprehensive 8-feature upgrade** that follows the same client-side fetch + weekly/monthly toggle pattern as the board's `BoardExecutiveStats`. It adds a new API endpoint, a main client component (`CoordinatorStats`), and reuses the existing `AdminSlotOverride` component scoped to the coordinator's timezones.

> [!WARNING]
> The coordinator must only see data for users in their assigned timezones. All queries will filter through `UserProfile.timezone` → `Slot.bookedBy` scoping. If a coordinator has **no timezones assigned**, the page shows an illustrated empty state (already implemented).

> [!IMPORTANT]
> The page layout uses a **tab-based approach** with 3 tabs: **Overview** (stats + coverage gaps), **Slots & Activity** (live timeline + recent feed + slot assignment), and **Users** (user activity list). This keeps the page premium and navigable without overwhelming scroll.

---

## Proposed Changes

### 1. New API Endpoint

#### [NEW] [`route.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/admin/coordinator-stats/route.ts)

A `GET` endpoint at `/api/v1/admin/coordinator-stats?range=week|month` that returns all coordinator-relevant metrics **scoped to their assigned timezones**.

**Auth**: Requires session with role `coordinator` or `superadmin`.

**Query params**:
- `range` — `"week"` (default) or `"month"`

**Scoping logic**:
1. Look up `CoordinatorAssignment` rows for `session.user.id` to get assigned timezones.
2. Look up `UserProfile` rows where `timezone IN assignedTimezones` to get `scopeUserIds`.
3. All slot/booking queries filter by `bookedBy IN scopeUserIds`.

**Response shape**:
```json
{
  "success": true,
  "data": {
    "range": "week",
    "timezones": ["Africa/Lagos", "Africa/Accra"],
    "scopedUserCount": 42,
    "slotFillRate": {
      "bible":   { "filled": 18, "total": 24, "rate": 75.0, "previousRate": 68.0, "change": 10.3 },
      "prayer":  { "filled": 14, "total": 24, "rate": 58.3, "previousRate": 52.0, "change": 12.1 },
      "worship": { "filled": 8,  "total": 24, "rate": 33.3, "previousRate": 29.0, "change": 14.8 }
    },
    "bookingsToday": {
      "count": 7,
      "previousDayCount": 5,
      "change": 40.0
    },
    "engagement": {
      "rate": 62.5,
      "previousRate": 55.0,
      "change": 13.6
    },
    "totalBookings": {
      "current": 156,
      "previous": 128,
      "change": 21.9
    },
    "coverageGaps": [
      { "date": "2026-09-22", "hour": 3, "type": "BIBLE", "startTime": "03:00", "endTime": "04:00" },
      { "date": "2026-09-22", "hour": 14, "type": "PRAYER", "startTime": "14:00", "endTime": "15:00" }
    ],
    "recentActivity": [
      {
        "id": "slot-id",
        "action": "booked",
        "userName": "Jane Doe",
        "userImage": null,
        "type": "BIBLE",
        "date": "2026-09-22",
        "startTime": "08:00",
        "endTime": "09:00",
        "timestamp": "2026-09-22T06:30:00Z"
      }
    ],
    "userActivity": [
      {
        "userId": "user-id",
        "name": "Jane Doe",
        "image": null,
        "timezone": "Africa/Lagos",
        "bookingsThisPeriod": 5,
        "lastBookingDate": "2026-09-21",
        "isActive": true
      }
    ]
  }
}
```

**Prisma queries** (all scoped to assigned timezones):

| Metric | Query |
|---|---|
| **Scoped Users** | `prisma.userProfile.findMany({ where: { timezone: { in: timezones } } })` → `scopeUserIds` |
| **Slot Fill Rate** (per type) | `prisma.slot.count({ where: { type, date: { gte, lte }, bookedBy: { in: scopeUserIds } } })` per channel for both periods |
| **Bookings Today** | `prisma.slot.count({ where: { date: today, bookedBy: { in: scopeUserIds } } })` |
| **Engagement** | `(filledUpcoming / totalUpcoming) * 100` for slots ≥ today scoped to users |
| **Total Bookings** | `prisma.slot.count({ where: { bookedBy: { in: scopeUserIds } } })` for current + previous period |
| **Coverage Gaps** | `prisma.slot.findMany({ where: { date: today, bookedBy: null } })` — limited to next 48 hours, returns at most 10 |
| **Recent Activity** | Join `Slot` (bookedBy in scope, updatedAt desc) with `User` names for last 15 actions |
| **User Activity** | Aggregate bookings per user in `scopeUserIds` for the selected period, joined with `User` name/image |

---

### 2. Zod Schema

#### [NEW] [`coordinatorStatsSchema.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/schemas/coordinatorStatsSchema.ts)

```typescript
import { z } from "zod"

export const coordinatorStatsQuerySchema = z.object({
  range: z.enum(["week", "month"]).default("week"),
})

export type CoordinatorStatsQuery = z.infer<typeof coordinatorStatsQuerySchema>
```

---

### 3. Main Client Component

#### [NEW] [`CoordinatorStats.tsx`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/coordinator/CoordinatorStats.tsx)

A `"use client"` component that is the heart of the coordinator dashboard. Follows the same pattern as `BoardExecutiveStats`:

1. **Weekly / Monthly toggle** (segmented control).
2. Fetches data from `/api/v1/admin/coordinator-stats?range=week|month` on mount and on toggle change.
3. **Skeleton loaders** while fetching.
4. **Tab-based layout** with 3 tabs:

#### Tab 1: Overview
- **6 stat cards** in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` layout:

  | # | Card Title | Icon | Primary Value | Progress Bar | Trend |
  |---|---|---|---|---|---|
  | 1 | **Scoped Users** | `Users` | `42 users` | — (info only) | — |
  | 2 | **Bible Fill Rate** | `BookOpen` | `75.0%` | filled/total | vs previous period |
  | 3 | **Prayer Fill Rate** | `HandHeart` | `58.3%` | filled/total | vs previous period |
  | 4 | **Worship Fill Rate** | `Music` | `33.3%` | filled/total | vs previous period |
  | 5 | **Bookings Today** | `CalendarCheck` | `7` | today vs previous day | vs previous day |
  | 6 | **Total Bookings** | `TrendingUp` | `156` | current vs previous period | % change |

- **Coverage Gaps section** below the stat cards:
  - Header: "Coverage Gaps" with `AlertTriangle` icon
  - Shows unfilled slots in the next 48 hours as a compact list
  - Each gap shows: date, time range, type badge, and a "Fill" button (opens `AdminSlotOverride` to that slot)
  - Empty state if no gaps: "All slots covered!" with a checkmark icon

#### Tab 2: Slots & Activity
- **Slot Override** section: Renders the existing `AdminSlotOverride` component (reused from admin) — allows the coordinator to pick a date, view slots scoped to their timezone users, and assign/override bookings.
- **Recent Activity Feed** below the slot override:
  - Header: "Recent Activity" with `Activity` icon
  - Scrollable list of the latest 15 booking/cancellation actions within their timezones
  - Each row: user avatar + name, action badge (Booked/Cancelled), slot type badge, date+time, relative timestamp
  - Empty state if no activity

#### Tab 3: Users
- **User Activity Table/List**:
  - Shows all users within the coordinator's assigned timezones
  - Columns: User (avatar + name), Timezone, Bookings (this period), Last Booking, Status (Active/Inactive badge)
  - Sortable by bookings count
  - "Inactive" = no bookings in the selected period
  - Inactive users highlighted with a subtle warning style
  - Empty state if no users in scope

**Component hierarchy**:
```
CoordinatorStats (client)
├── RangeToggle (weekly/monthly)
├── Tabs
│   ├── Overview
│   │   ├── StatCards (6 cards, grid)
│   │   └── CoverageGaps (compact list)
│   ├── Slots & Activity
│   │   ├── AdminSlotOverride (reused)
│   │   └── RecentActivityFeed (list)
│   └── Users
│       └── UserActivityList (table)
└── Skeleton (loading state)
```

---

### 4. Update Coordinator Page

#### [MODIFY] [`page.tsx`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(dashboard)/coordinator/page.tsx)

Replace the entire current implementation:

**Before**: Server-rendered page with 4 basic stat cards + timezone badge list
**After**: Server component that:
1. Checks session + role (coordinator or superadmin)
2. Fetches `CoordinatorAssignment` to get timezones
3. If no timezones → renders the existing empty state (unchanged)
4. If timezones exist → renders page header with icon + title + timezone count badge, then `<CoordinatorStats timezones={timezones} />`

The page header still uses the existing i18n keys. The heavy lifting moves to the client component.

```tsx
// Simplified structure:
export default async function CoordinatorDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const assignments = await prisma.coordinatorAssignment.findMany({
    where: { userId: session.user.id },
  })
  const timezones = assignments.map((a) => a.timezone)

  // ... i18n keys (same as before) ...

  return (
    <div className="flex flex-col gap-6">
      {/* Page header with icon + title */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{pageTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {timezones.length} timezone{timezones.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>

      {timezones.length === 0 ? (
        /* Empty state card — unchanged from current */
      ) : (
        <CoordinatorStats timezones={timezones} />
      )}
    </div>
  )
}
```

---

### 5. i18n Translations

#### [MODIFY] [`admin.json`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/messages/en/admin.json) (and `es/`, `fr/`, `pt/` equivalents)

New keys under the `coordinator.stats.*`, `coordinator.tabs.*`, `coordinator.gaps.*`, `coordinator.activity.*`, and `coordinator.users.*` namespaces:

```json
{
  "coordinator.stats.title": "Operational Insights",
  "coordinator.stats.description": "Timezone-scoped performance metrics with period-over-period trends.",
  "coordinator.stats.weekly": "This Week",
  "coordinator.stats.monthly": "This Month",
  "coordinator.stats.scopedUsers": "Scoped Users",
  "coordinator.stats.scopedUsersDesc": "users in your timezones",
  "coordinator.stats.bibleFillRate": "Bible Fill Rate",
  "coordinator.stats.prayerFillRate": "Prayer Fill Rate",
  "coordinator.stats.worshipFillRate": "Worship Fill Rate",
  "coordinator.stats.fillRateDesc": "{{filled}} of {{total}} slots filled",
  "coordinator.stats.bookingsToday": "Bookings Today",
  "coordinator.stats.bookingsTodayDesc": "confirmed today in your zones",
  "coordinator.stats.totalBookings": "Period Bookings",
  "coordinator.stats.totalBookingsDesc": "confirmed this period",
  "coordinator.tabs.overview": "Overview",
  "coordinator.tabs.slots": "Slots & Activity",
  "coordinator.tabs.users": "Users",
  "coordinator.gaps.title": "Coverage Gaps",
  "coordinator.gaps.description": "Unfilled slots in the next 48 hours",
  "coordinator.gaps.empty": "All slots covered!",
  "coordinator.gaps.emptyDesc": "No coverage gaps in the next 48 hours.",
  "coordinator.gaps.fill": "Fill",
  "coordinator.activity.title": "Recent Activity",
  "coordinator.activity.description": "Latest bookings and cancellations in your timezones",
  "coordinator.activity.empty": "No recent activity",
  "coordinator.activity.emptyDesc": "Booking activity will appear here as users interact with slots.",
  "coordinator.activity.booked": "Booked",
  "coordinator.activity.cancelled": "Cancelled",
  "coordinator.users.title": "User Activity",
  "coordinator.users.description": "Members in your assigned timezones and their booking patterns",
  "coordinator.users.empty": "No users in scope",
  "coordinator.users.emptyDesc": "No members are registered in your assigned timezones yet.",
  "coordinator.users.col.name": "Member",
  "coordinator.users.col.timezone": "Timezone",
  "coordinator.users.col.bookings": "Bookings",
  "coordinator.users.col.lastBooking": "Last Booking",
  "coordinator.users.col.status": "Status",
  "coordinator.users.active": "Active",
  "coordinator.users.inactive": "Inactive",
  "coordinator.users.never": "Never",
  "coordinator.slotOverride.title": "Slot Assignment",
  "coordinator.slotOverride.description": "Pick a date to view and assign slots for users in your timezones."
}
```

---

### 6. Proxy Verification

#### [VERIFY] [`proxy.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/proxy.ts)

The new API route `/api/v1/admin/coordinator-stats` falls under `/api/v1/` which requires authentication. The endpoint itself does its own role check (like the board-stats endpoint does), so **no proxy change is required**. The general auth check at proxy.ts L171 handles it.

---

## File Summary

| Action | File | Description |
|---|---|---|
| **NEW** | `app/api/v1/admin/coordinator-stats/route.ts` | API endpoint — timezone-scoped coordinator metrics |
| **NEW** | `lib/schemas/coordinatorStatsSchema.ts` | Zod query validation |
| **NEW** | `components/coordinator/CoordinatorStats.tsx` | Main client component — tabs, stats, gaps, feed, users |
| **MODIFY** | `app/(dashboard)/coordinator/page.tsx` | Slim server shell → delegates to `CoordinatorStats` |
| **MODIFY** | `messages/{en,es,fr,pt}/admin.json` | Add coordinator i18n keys |

---

## Verification Plan

### Automated
```bash
bun run check        # Biome lint + format
bunx tsc --noEmit    # Type check
```

### Manual
1. Navigate to `/coordinator` as a `coordinator`-role user with assigned timezones → verify the tab layout renders.
2. Toggle between "This Week" and "This Month" → verify data refreshes.
3. **Overview tab**: Verify 6 stat cards show timezone-scoped data with trend badges. Verify coverage gaps section shows unfilled slots or "All covered" empty state.
4. **Slots & Activity tab**: Verify `AdminSlotOverride` calendar renders and slot list loads. Verify recent activity feed shows booking/cancellation actions. Test assigning a user to a slot from this tab.
5. **Users tab**: Verify user list shows members in assigned timezones. Verify Active/Inactive badges render correctly. Verify inactive users are visually distinguished.
6. Test with a coordinator who has **no timezones** → verify empty state still renders correctly.
7. Test with `superadmin` role → verify access is granted.
8. Test with `member` role → verify redirect to `/unauthorized`.
9. Test skeleton loading states (throttle network in DevTools).
10. Test responsiveness: 360px phone → tablet → desktop.
11. Verify API returns 401 for unauthenticated and 403 for `member`/`board` roles.
