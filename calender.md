# Calendar Page — Real Data Integration Prompt

> **Mandatory Reference Directive**: Always consult `@AGENTS.md` for the full tech stack, directory structure, Prisma schema, Zod conventions, RBAC role hierarchy, and shadcn/ui design rules. Consult `@bookings.md` for the Slot, MeetingLink, and BookingConfig models and business rules.

---

## 1. Goal

Wire the `/calendar` page (`app/(dashboard)/calendar/page.tsx`) to display **real data** from the database — specifically the current user's **booked Slots** and their **own Events**. The existing `CalendarView` UI component (`components/calendar/calendar-view.tsx`) must be **preserved** in terms of its visual layout, grid structure, sidebar panel, toolbar, and month-navigation UX. Changes are limited to:

- Replacing hardcoded sample data with live Prisma queries.
- Adapting the `CalendarEvent` interface and color mapping to align with TGAW's domain.
- Reworking the sidebar to show TGAW-relevant filter categories instead of generic ones.
- Adding click-to-detail interactions, loading skeletons, and empty states.

---

## 2. Data Sources

### 2.1 Slots (from `Slot` model)

The `Slot` model represents 30-minute devotional booking windows. Each slot has:

| Field       | Type        | Description                                    |
|-------------|-------------|------------------------------------------------|
| `id`        | `String`    | ObjectId primary key                           |
| `type`      | `EventType` | `BIBLE` \| `PRAYER` \| `PRAISE_WORSHIP`        |
| `date`      | `String`    | `YYYY-MM-DD` (UTC)                             |
| `startTime` | `String`    | `HH:MM` (UTC, e.g. `"08:00"`)                 |
| `endTime`   | `String`    | `HH:MM` (UTC, e.g. `"08:30"`)                 |
| `bookedBy`  | `String?`   | `user.id` of who booked it (`null` = available)|
| `notes`     | `String?`   | Optional user-provided context                 |

**Query scope**: Only slots where `bookedBy === session.user.id` (the current logged-in user's booked slots).

### 2.2 Events (from `Event` model)

The `Event` model represents user-created events. Each event has:

| Field      | Type        | Description                                     |
|------------|-------------|-------------------------------------------------|
| `id`       | `String`    | ObjectId primary key                            |
| `userId`   | `String`    | Owner/host user.id                              |
| `type`     | `EventType` | `BIBLE` \| `PRAYER` \| `PRAISE_WORSHIP`         |
| `title`    | `String`    | Event title                                     |
| `passage`  | `String?`   | Bible passage or prayer focus                   |
| `date`     | `String`    | `YYYY-MM-DD`                                    |
| `time`     | `String`    | `HH:MM` (24h)                                  |
| `duration` | `Int`       | Duration in minutes                             |
| `zoomUrl`  | `String?`   | Zoom/Teams meeting link                         |
| `notes`    | `String?`   | Optional notes                                  |

**Query scope**: Only events where `userId === session.user.id`.

### 2.3 MeetingLink (from `MeetingLink` model)

For booked slots, the associated Zoom/Teams link should be fetched and displayed. Each `MeetingLink` is unique per `[type, date]`:

| Field     | Type        | Description                      |
|-----------|-------------|----------------------------------|
| `type`    | `EventType` | Matches the slot type            |
| `date`    | `String`    | `YYYY-MM-DD`                     |
| `url`     | `String`    | The Zoom/Teams URL               |
| `label`   | `String?`   | Optional label (e.g. "Morning Zoom Room") |

**Query scope**: Fetch meeting links for all `[type, date]` combinations that the user has booked slots for.

---

## 3. Architecture — Server Component + Client Component Split

### 3.1 Server Component: `app/(dashboard)/calendar/page.tsx`

Convert this file from `"use client"` to a **Server Component** (remove `"use client"` directive). This page will:

1. **Authenticate** via `auth.api.getSession({ headers: await headers() })` — redirect to `/login` if no session.
2. **Read the target month** from `searchParams` (e.g. `?month=2026-08`). Default to the current month if absent.
3. **Compute the date range** for the target month (first day to last day, in `YYYY-MM-DD` format).
4. **Fetch the user's timezone** from `UserProfile` via Prisma:
   ```ts
   const profile = await prisma.userProfile.findUnique({
     where: { userId: session.user.id },
     select: { timezone: true },
   });
   const userTimezone = profile?.timezone ?? "UTC";
   ```
5. **Query Slots** booked by the user in the date range:
   ```ts
   const slots = await prisma.slot.findMany({
     where: {
       bookedBy: session.user.id,
       date: { gte: startDate, lte: endDate },
     },
     orderBy: [{ date: "asc" }, { startTime: "asc" }],
   });
   ```
6. **Query Events** owned by the user in the date range:
   ```ts
   const events = await prisma.event.findMany({
     where: {
       userId: session.user.id,
       date: { gte: startDate, lte: endDate },
     },
     orderBy: [{ date: "asc" }, { time: "asc" }],
   });
   ```
7. **Query MeetingLinks** for slot type+date combinations the user has booked:
   ```ts
   const slotKeys = [...new Set(slots.map(s => `${s.type}|${s.date}`))];
   const meetingLinks = await prisma.meetingLink.findMany({
     where: {
       OR: slotKeys.map(key => {
         const [type, date] = key.split("|");
         return { type: type as EventType, date };
       }),
     },
   });
   ```
8. **Transform** the raw Prisma data into a serializable `CalendarItem[]` array (see §4 below) and pass it as a prop to `<CalendarView />`.
9. **Pass `userTimezone`** as a prop to `<CalendarView />`.
10. **Pass `currentMonth`** (the `YYYY-MM` string) as a prop so the client component knows the server-rendered month.

### 3.2 Client Component: `components/calendar/calendar-view.tsx`

The `CalendarView` component remains `"use client"`. It receives:

```ts
interface CalendarViewProps {
  items?: CalendarItem[];
  userTimezone?: string;
  initialMonth?: string; // "YYYY-MM"
  className?: string;
}
```

When the user navigates to a previous/next month, the component should trigger a **re-fetch** by updating the URL `searchParams` (e.g. `router.push(\`/calendar?month=${newMonth}\`)`), which causes the server component to re-render with the new month's data.

---

## 4. CalendarItem Interface

Replace the existing `CalendarEvent` interface with a unified `CalendarItem` type that accommodates both Slots and Events:

```ts
export type CalendarItemSource = "slot" | "event";

export type CalendarItemColor = "purple" | "red" | "amber" | "blue";

export interface CalendarItem {
  id: string;
  source: CalendarItemSource;           // "slot" or "event"
  type: "BIBLE" | "PRAYER" | "PRAISE_WORSHIP";
  title: string;                         // e.g. "Bible Reading 08:00–08:30" or event title
  color: CalendarItemColor;
  date: string;                          // ISO date string (serializable from server)
  startTime: string;                     // "HH:MM" in user's timezone
  endTime?: string;                      // "HH:MM" in user's timezone (slots always have this)
  duration?: number;                     // minutes (events have this)
  notes?: string | null;
  passage?: string | null;               // Bible passage or prayer focus
  zoomUrl?: string | null;               // from Event.zoomUrl or MeetingLink.url
  zoomLabel?: string | null;             // from MeetingLink.label
}
```

### 4.1 Color Mapping

Map `EventType` to colors consistently with `bookings.md`:

| `EventType`       | `CalendarItemColor` | Tailwind Class  |
|--------------------|---------------------|-----------------|
| `BIBLE`            | `"purple"`          | `bg-purple-500` |
| `PRAYER`           | `"red"`             | `bg-red-500`    |
| `PRAISE_WORSHIP`   | `"amber"`           | `bg-amber-500`  |
| *(user Event)*     | `"blue"`            | `bg-blue-500`   |

Update the `CALENDAR_COLORS` map accordingly:

```ts
const CALENDAR_COLORS: Record<CalendarItemColor, string> = {
  purple: "bg-purple-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};
```

### 4.2 Transformation Logic (Server-Side)

In the server component, transform raw Prisma records to `CalendarItem[]`:

**For Slots:**
```ts
const SLOT_COLOR_MAP: Record<EventType, CalendarItemColor> = {
  BIBLE: "purple",
  PRAYER: "red",
  PRAISE_WORSHIP: "amber",
};

slots.map(slot => ({
  id: slot.id,
  source: "slot" as const,
  type: slot.type,
  title: slotTypeLabel(slot.type) + ` ${convertTimeToTimezone(slot.startTime, slot.date, userTimezone)}–${convertTimeToTimezone(slot.endTime, slot.date, userTimezone)}`,
  color: SLOT_COLOR_MAP[slot.type],
  date: utcSlotToLocalDate(slot.date, slot.startTime, userTimezone).toISOString(),
  startTime: convertTimeToTimezone(slot.startTime, slot.date, userTimezone),
  endTime: convertTimeToTimezone(slot.endTime, slot.date, userTimezone),
  notes: slot.notes,
  zoomUrl: meetingLinkMap[`${slot.type}|${slot.date}`]?.url ?? null,
  zoomLabel: meetingLinkMap[`${slot.type}|${slot.date}`]?.label ?? null,
}));
```

**For Events:**
```ts
events.map(event => ({
  id: event.id,
  source: "event" as const,
  type: event.type,
  title: event.title,
  color: "blue" as const,
  date: utcSlotToLocalDate(event.date, event.time, userTimezone).toISOString(),
  startTime: convertTimeToTimezone(event.time, event.date, userTimezone),
  duration: event.duration,
  notes: event.notes,
  passage: event.passage,
  zoomUrl: event.zoomUrl,
}));
```

Helper labels:
```ts
function slotTypeLabel(type: EventType): string {
  switch (type) {
    case "BIBLE": return "Bible Reading";
    case "PRAYER": return "Prayer";
    case "PRAISE_WORSHIP": return "Praise & Worship";
  }
}
```

---

## 5. Sidebar Rework

### 5.1 Replace "My Calendars" List

Replace the hardcoded `CALENDAR_LISTS` array (`Personal`, `Work`, `Family`) with TGAW-domain filter categories:

```ts
import { BookOpen, HandHeart, Music, CalendarDays } from "lucide-react";

const CALENDAR_FILTERS = [
  { id: "BIBLE",          label: "Bible Reading",    color: "bg-purple-500", icon: BookOpen },
  { id: "PRAYER",         label: "Prayer",           color: "bg-red-500",    icon: HandHeart },
  { id: "PRAISE_WORSHIP", label: "Praise & Worship", color: "bg-amber-500",  icon: Music },
  { id: "EVENTS",         label: "My Events",        color: "bg-blue-500",   icon: CalendarDays },
] as const;
```

### 5.2 Toggle Filters

Each filter item is **toggleable** (checked/unchecked). Maintain a `Set<string>` of active filter IDs in state. When a filter is toggled off, hide the corresponding items from the calendar grid.

- Default: all four filters are **ON**.
- The checkbox (currently a colored square with a `<Check>` icon) should show/hide the check icon based on active state.
- The filter state should also affect the search — searching only filters within the active categories.

### 5.3 Remove Irrelevant Sections

- **Remove** the "Favorites" and "Other" empty collapsible sections.
- **Remove** the "New Calendar" button at the bottom.
- **Keep** the "Add New Event" button — wire it to open an event-creation dialog (see §7).

---

## 6. Detail Panel / Popover

When the user clicks an **event/slot chip** in the calendar grid (the colored pill with the clock icon and title), show a **Popover** (using shadcn `<Popover>`) or a slide-over panel with the following details:

### 6.1 For Slots:

| Field               | Display                                          |
|---------------------|--------------------------------------------------|
| Type badge          | Colored badge: "Bible Reading" / "Prayer" / "Praise & Worship" |
| Time                | `startTime – endTime` (in user timezone)         |
| Date                | Formatted date (e.g., "Thursday, August 14, 2026") |
| Notes               | User's booking notes (if any)                    |
| Zoom/Teams link     | Clickable link (if MeetingLink exists for that type+date) |
| Status              | "Booked" badge                                   |

### 6.2 For Events:

| Field               | Display                                          |
|---------------------|--------------------------------------------------|
| Title               | The event title                                  |
| Type badge          | Colored badge matching the event type            |
| Time                | `time` + `duration` formatted (e.g., "08:00 – 09:00 (60 min)") |
| Date                | Formatted date                                   |
| Passage             | Bible passage or prayer focus (if any)           |
| Notes               | Event notes (if any)                             |
| Zoom link           | Clickable link (if `zoomUrl` exists)             |

### 6.3 UX Details:

- The popover should appear anchored to the clicked chip.
- Include a close button (X icon) in the top-right corner.
- On mobile (< `md` breakpoint), use a **bottom sheet dialog** instead of a popover for better touch UX.

---

## 7. "Add New Event" Dialog

The "Add New Event" button in the sidebar should open a **shadcn `<Dialog>`** with a form to create a new `Event` using the existing `createEventSchema` Zod schema:

### 7.1 Form Fields:

| Field    | Input Type                | Validation                              |
|----------|---------------------------|-----------------------------------------|
| Type     | `<Select>` with options: Bible, Prayer, Praise & Worship | Required |
| Title    | `<Input type="text">`     | Required, min 1 char                    |
| Date     | Date picker (`<Calendar>` in popover) | Required, `YYYY-MM-DD`       |
| Time     | `<Input type="time">`     | Required, `HH:MM`                       |
| Duration | `<Input type="number">`   | Required, positive integer (minutes)    |
| Passage  | `<Input type="text">`     | Optional                                |
| Zoom URL | `<Input type="url">`      | Optional, valid URL                     |
| Notes    | `<Textarea>`              | Optional                                |

### 7.2 Submission:

- Use React Hook Form + Zod resolver with `createEventSchema`.
- Submit via `POST /api/v1/events` (the existing API route).
- On success: close the dialog, show a success toast, and **revalidate** the calendar data (via `router.refresh()` or `revalidatePath("/calendar")`).
- On error: show inline field errors from Zod validation.

---

## 8. Timezone Conversion

### 8.1 Server-Side Conversion

Create a utility function in a new file `lib/calendar-utils.ts`:

```ts
import { formatInTimeZone } from "date-fns-tz";

/**
 * Convert a UTC date string + time string to a Date object.
 */
export function utcSlotToLocalDate(
  dateStr: string,      // "YYYY-MM-DD"
  timeStr: string,      // "HH:MM"
  timezone: string       // e.g. "America/New_York"
): Date {
  const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);
  return utcDate;
}

/**
 * Convert a UTC HH:MM time to the user's local HH:MM.
 */
export function convertTimeToTimezone(
  timeStr: string,       // "HH:MM" UTC
  dateStr: string,       // "YYYY-MM-DD" for DST awareness
  timezone: string
): string {
  const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);
  return formatInTimeZone(utcDate, timezone, "HH:mm");
}
```

### 8.2 Client-Side Display

The `CalendarView` component receives the `userTimezone` string and pre-converted `CalendarItem[]` data. Times displayed in popover details should use the already-converted `startTime`/`endTime` strings.

### 8.3 Dependency

Ensure `date-fns-tz` is installed:
```bash
bun add date-fns-tz
```

---

## 9. Loading & Empty States

### 9.1 Loading Skeleton

Create a `CalendarSkeleton` component that renders:
- A skeleton toolbar (month nav + search bar area).
- A 7-column grid matching the calendar layout, with pulsing placeholder cells.
- The sidebar should also show skeleton placeholders for the filter list.

Use this skeleton as the `loading.tsx` file for the calendar route:
```
app/(dashboard)/calendar/loading.tsx
```

### 9.2 Empty State

When the fetched `CalendarItem[]` for a month is empty, display an illustrated empty state **inside the calendar grid area**:

- A centered icon (e.g., `CalendarDays` from Lucide, large and muted).
- Heading: "No bookings or events this month"
- Subtext: "Book a devotional slot or create an event to get started."
- Two CTA buttons:
  - "Book a Slot" → navigates to `/bible` (or a relevant booking page)
  - "Create Event" → opens the Add Event dialog

---

## 10. Month Navigation Re-Fetch

### 10.1 URL-Based Navigation

When the user clicks the previous/next month buttons or the "Today" button:

1. Compute the new month string (e.g. `"2026-09"`).
2. Use `router.push(\`/calendar?month=${newMonth}\`, { scroll: false })` to update the URL.
3. The server component re-renders with the new `searchParams.month`, fetching the corresponding data.
4. Next.js streaming shows the loading skeleton during the fetch.

### 10.2 Mini Calendar Sync

The sidebar mini-calendar (`<Calendar>` component) should stay synced:
- When a date is selected on the mini-calendar, navigate to that month if it's different from the current view.
- The selected date should highlight the corresponding day cell in the main grid.

---

## 11. Files to Create / Modify

### Modified Files:

| File | Changes |
|------|---------|
| `app/(dashboard)/calendar/page.tsx` | Remove `"use client"`, add Prisma queries, transform data, pass as props |
| `components/calendar/calendar-view.tsx` | Update `CalendarEvent` → `CalendarItem`, update color map, rework sidebar filters, add popover on click, add URL-based month nav, add empty state |

### New Files:

| File | Purpose |
|------|---------|
| `app/(dashboard)/calendar/loading.tsx` | Skeleton loading state for the calendar route |
| `lib/calendar-utils.ts` | Timezone conversion helpers (`utcSlotToLocalDate`, `convertTimeToTimezone`) |
| `components/calendar/calendar-detail-popover.tsx` | Popover/bottom-sheet component for slot/event details |
| `components/calendar/calendar-skeleton.tsx` | Reusable skeleton component |
| `components/calendar/calendar-empty-state.tsx` | Empty state illustration component |
| `components/calendar/event-form-dialog.tsx` | "Add New Event" dialog with React Hook Form |

### Dependency to Install:

```bash
bun add date-fns-tz
```

---

## 12. Constraints & Non-Goals

- **Do NOT** change the overall visual layout of the `CalendarView` component (grid structure, day cell sizing, toolbar layout, responsive breakpoints).
- **Do NOT** add slot booking functionality to the calendar — slot booking stays on `/bible`, `/prayer`, `/worship`.
- **Do NOT** show other users' data — only the current session user's booked slots and owned events.
- **Do NOT** modify the Prisma schema or API routes — use existing models and endpoints as-is.
- **Do NOT** create or modify `middleware.ts` — route protection is handled by `proxy.ts`.
- Use shadcn semantic tokens for all colors (`bg-background`, `bg-card`, `text-muted-foreground`, etc.) except for the type-specific accent colors (purple, red, amber, blue).
- All interactive elements must have unique IDs, ARIA labels, and keyboard accessibility.
- Animations should use `motion/react` and respect `prefers-reduced-motion`.
