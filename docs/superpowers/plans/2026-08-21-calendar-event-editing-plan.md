# Calendar Event Editing & Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Coordinators and Superadmins to edit and delete calendar events (Bible Reading, Prayer, Praise & Worship, and Special Events) directly from the `/calendar` view with displacement warning handling and slot restoration.

**Architecture:** Extend `CalendarItem` with raw event metadata, add edit/delete capabilities to `CalendarDetailPopover` gated by user role, expand `EventFormDialog` to handle both create and edit modes against `/api/v1/events/:id`, and wire slot block restoration on deletion and modification.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui (Dialog, AlertDialog, Popover, Sheet), Prisma ORM, Zod.

## Global Constraints
- Strictly use shadcn/ui components and semantic design tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- Maintain role-based access control: only `superadmin` and `coordinator` can edit or delete events.
- Never show event edit/delete controls for member-booked individual slots (`source === "slot"`).
- Preserve slot blocking displacement checks and slot restoration upon special event changes or deletions.

---

### Task 1: Extend CalendarItem Data & Props

**Files:**
- Modify: `components/calendar/calendar-view.tsx`
- Modify: `app/(dashboard)/calendar/page.tsx`

**Interfaces:**
- Consumes: Prisma `Event` model and auth session role.
- Produces: Enhanced `CalendarItem` type with `rawEventId?: string`, `rawDate?: string`, `rawTime?: string`, `blockTypes?: string[]`, and `canManage` boolean passed down to `CalendarView`.

- [ ] **Step 1: Update `CalendarItem` interface in `components/calendar/calendar-view.tsx`**
Add `rawEventId?: string`, `rawDate?: string`, `rawTime?: string`, `blockTypes?: string[]` to `CalendarItem`.

- [ ] **Step 2: Update `app/(dashboard)/calendar/page.tsx`**
Map `rawEventId: event.id`, `rawDate: event.date`, `rawTime: event.time`, `blockTypes: event.blockTypes ?? []` onto `eventItems` and pass `canManage={session.user.role === "superadmin" || session.user.role === "coordinator"}` to `<CalendarView />`.

- [ ] **Step 3: Run typecheck**
Run: `bun run typecheck`
Expected: `tsc --noEmit` exits with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add components/calendar/calendar-view.tsx app/(dashboard)/calendar/page.tsx
git commit -m "feat(calendar): extend CalendarItem with raw event data and canManage prop"
```

---

### Task 2: Enhance EventFormDialog to Support Edit Mode

**Files:**
- Modify: `components/calendar/event-form-dialog.tsx`

**Interfaces:**
- Consumes: `CalendarItem` and `mode?: "create" | "edit"`
- Produces: Reusable `EventFormDialog` supporting both creation (`POST /api/v1/events`) and updates (`PATCH /api/v1/events/:id`).

- [ ] **Step 1: Update `EventFormDialog` props and form reset on initial item change**
Add `mode?: "create" | "edit"` and `event?: CalendarItem | null` to `EventFormDialogProps`.
When `event` changes and `open` is true, populate form values with `event`'s `title`, `type`, `passage`, `rawDate`, `rawTime`, `duration`, `zoomUrl`, `notes`, and `blockTypes`.

- [ ] **Step 2: Update submission logic for edit mode**
When `mode === "edit"` and `event?.rawEventId` is present:
- Send `PATCH /api/v1/events/${event.rawEventId}`.
- If response contains `willDisplace`, display the displacement warning.
- On success, toast "Event updated successfully", close dialog, and call `router.refresh()`.

- [ ] **Step 3: Run typecheck**
Run: `bun run typecheck`
Expected: `tsc --noEmit` exits with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add components/calendar/event-form-dialog.tsx
git commit -m "feat(calendar): add edit mode to EventFormDialog"
```

---

### Task 3: Add Edit & Delete Actions to CalendarDetailPopover and CalendarView

**Files:**
- Modify: `components/calendar/calendar-detail-popover.tsx`
- Modify: `components/calendar/calendar-view.tsx`

**Interfaces:**
- Consumes: `canManage?: boolean`, `onEdit?: (item: CalendarItem) => void`, `onDelete?: (item: CalendarItem) => void`.
- Produces: Interactive Edit and Delete actions for events with confirmation dialog and automatic slot unblocking.

- [ ] **Step 1: Update `CalendarDetailPopover` with Edit & Delete action buttons**
When `item.source === "event"` and `canManage === true`:
- Render **Edit** button (opens edit modal).
- Render **Delete** button with `AlertDialog` confirmation prompt: "Delete this event? This will unblock any slots reserved for this event and restore displaced bookings."

- [ ] **Step 2: Wire edit and delete handlers in `CalendarView`**
In `CalendarView`:
- State for `editingEvent: CalendarItem | null` and `isEditOpen: boolean`.
- Handle `onDelete`: calls `DELETE /api/v1/events/${item.rawEventId}`, shows toast "Event deleted", and calls `router.refresh()`.
- Pass `onEdit` and `onDelete` to each `CalendarDetailPopover`.
- Render `EventFormDialog` with `mode="edit"` and `event={editingEvent}`.

- [ ] **Step 3: Run typecheck**
Run: `bun run typecheck`
Expected: `tsc --noEmit` exits with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add components/calendar/calendar-detail-popover.tsx components/calendar/calendar-view.tsx
git commit -m "feat(calendar): add edit and delete actions to calendar detail popover"
```

---

### Task 4: Full Suite Verification

**Files:**
- Test across all calendar and slot services.

- [ ] **Step 1: Run unit tests**
Run: `bun test`
Expected: All 38+ tests pass.

- [ ] **Step 2: Run linter**
Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 3: Run full Next.js build**
Run: `bun run build`
Expected: Build succeeds.
