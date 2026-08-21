# Calendar Event Editing & Deletion Specification

## 1. Overview
Allow **Coordinators** and **Superadmins** to edit and delete calendar events (Bible Reading, Prayer, Praise & Worship, and Special Events) directly from the `/calendar` view. When events are updated or deleted, the system maintains slot blocking integrity, unblocking displaced or previously blocked slots and applying new blocks as necessary.

---

## 2. User Experience & Interactions

### A. Calendar Detail Popover / Sheet (`CalendarDetailPopover`)
- When a user views an event (`item.source === "event"`) and has management privileges (`canManageEvents`: `coordinator` or `superadmin`):
  - Two action buttons appear in the details header/footer:
    - **Edit** (Pencil icon): Opens the `EventFormDialog` in edit mode with current event data prefilled.
    - **Delete** (Trash icon): Opens an `AlertDialog` confirmation asking whether to delete the event and restore any displaced/blocked slots.

### B. Event Form Dialog in Edit Mode (`EventFormDialog`)
- Supports both `mode="create"` (default) and `mode="edit"`.
- When in `mode="edit"`:
  - Header displays **"Edit Event"** with subtitle *"Update event details, timing, or blocking settings"*.
  - Form fields (`title`, `type`, `passage`, `date`, `time`, `duration`, `zoomUrl`, `notes`, `blockTypes`) are prefilled from the selected event.
  - Submit button shows **"Save Changes"** (or **"Updating..."** while in flight).
  - Handles Special Event displacement warning if date/time/duration/block stream modifications displace existing slot bookings.
  - Submitting sends a `PATCH /api/v1/events/:id`.
  - On success, displays a success toast, closes dialog, and refreshes calendar view.

---

## 3. Data & API Layer

### A. Calendar Item Enrichment (`app/(dashboard)/calendar/page.tsx`)
- Ensure `CalendarItem` includes:
  - `rawEventId`: Original MongoDB string ID (without `event-` prefix).
  - `rawDate`: YYYY-MM-DD date string.
  - `rawTime`: HH:MM time string.
  - `blockTypes`: string array of blocked stream types (`BIBLE`, `PRAYER`, `PRAISE_WORSHIP`).
  - `userId`: Creator's user ID.
- Pass `canManage={session.user.role === "superadmin" || session.user.role === "coordinator"}` through `CalendarView` to `CalendarDetailPopover`.

### B. Event API Endpoints (`/api/v1/events/:id`)
- `PATCH /api/v1/events/:id`:
  - RBAC: Verified coordinator or superadmin.
  - Re-evaluates slot blocking window if `date`, `time`, `duration`, `type`, or `blockTypes` changed.
  - Returns updated event object and blocking results.
- `DELETE /api/v1/events/:id`:
  - RBAC: Verified coordinator or superadmin.
  - Unblocks any slots previously blocked by the event, restoring displaced bookers.
  - Deletes the event record from Prisma.

---

## 4. Error Handling & Edge Cases
- **Non-events (booked slots)**: Do not show the Event edit/delete buttons; personal slot cancellations follow standard slot cancellation flow.
- **Concurrent edits**: Validated against Prisma updates and schema constraints.
- **Displacement preview**: If changing time overlaps active bookings, user gets the warning dialog and must confirm before changes apply.

---

## 5. Verification Plan
1. **Unit & API verification**: Test `PATCH /api/v1/events/:id` and `DELETE /api/v1/events/:id`.
2. **Typecheck**: `bun run typecheck` (`tsc --noEmit`).
3. **Linting**: `bun run lint`.
4. **Test suite**: `bun test`.
5. **Interactive UI check**: Create event -> click to view details -> click Edit -> update title/time -> verify changes reflected in calendar; click Delete -> confirm -> verify event removed and slots restored.
