# Default Meeting Links Feature Specification

## Overview
Currently, meeting links in `MeetingLink` are scoped per specific date (`date: YYYY-MM-DD`). If no meeting link is explicitly created for a date, users see "No Zoom links available". Leaders and admins need the ability to configure permanent default Zoom/Teams links for **Bible Reading**, **Prayer Watch**, and **Praise & Worship** that automatically apply to all days, while retaining the ability to set date-specific link overrides for special events.

## Key Changes

### 1. Schema & Validation (`lib/schemas/slotSchema.ts`)
- Update `upsertMeetingLinkSchema` date validation to accept `"DEFAULT"` in addition to `YYYY-MM-DD` regex:
  ```ts
  date: z.string().refine((val) => val === "DEFAULT" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Invalid date format (YYYY-MM-DD or DEFAULT)",
  })
  ```

### 2. Resolution Hierarchy (`lib/services/slotService.ts`)
- In `getSlotsForDate(date, type, ...)`:
  - Query `MeetingLink` for `date: date` and `date: "DEFAULT"`.
  - For each `EventType` (`BIBLE`, `PRAYER`, `PRAISE_WORSHIP`), resolve the active link as:
    ```ts
    const getLinkForType = (t: EventType) =>
      meetingLinks.find((m) => m.type === t && m.date === date) ||
      meetingLinks.find((m) => m.type === t && m.date === "DEFAULT") ||
      null;
    ```

### 3. Admin UI Upgrade (`components/booking/AdminMeetingLinkManager.tsx`)
- Add **Default Meeting Links (All Days)** section featuring 3 category cards (Bible Reading, Prayer Watch, Praise & Worship).
- Each card shows current default URL/label, live indicator badge, quick inline editing, and a "Save Default" button.
- Retain the **Date-Specific Link Overrides** section with calendar picker for date-specific overrides.

## Verification Plan
1. Type checking via `npx tsc --noEmit`.
2. Build verification via `bun run build`.
