# Bookings Feature — Implementation Prompt

> **Mandatory Reference Directive**: Always consult `@AGENTS.md` for the full tech stack, directory structure, Prisma schema, Zod conventions, RBAC role hierarchy, and shadcn/ui design rules before implementing any file in this feature.

---

## 1. Feature Overview

Build a **Slot Booking System** for The Global Altar Watch (TGAW) that allows authenticated users to book fixed **30-minute devotional time slots** across three activity types:

| Type              | Enum Value       | Sidebar Page | Colour Accent  |
|-------------------|------------------|--------------|----------------|
| Bible Reading     | `BIBLE`          | `/bible`     | Purple (`purple-500`) |
| Prayer            | `PRAYER`         | `/prayer`    | Red/Orange (`red-500`) |
| Praise & Worship  | `PRAISE_WORSHIP` | `/worship`   | Amber/Gold (`amber-500`) |

### Core Concept

Every calendar day is divided into **48 fixed 30-minute slots** covering the full 24 hours (00:00–00:30, 00:30–01:00, …, 23:30–24:00). Slots exist independently for **each of the three activity types**, giving a total of **144 bookable slots per day** (48 × 3). However, a single user **cannot book overlapping times across different types** (e.g., if a user books Bible Reading 08:00–08:30, they cannot also book Prayer 08:00–08:30).

---

## 2. Business Rules

### 2.1 Slot Generation

- Slots are **auto-generated** on a rolling basis for the **entire month ahead** (from today through the last day of the next calendar month).
- Auto-generation should run via:
  - A **server action** (`actions/slotActions.ts`) triggered by a **cron-style mechanism** (e.g., a daily API route `/api/v1/slots/generate` protected by a secret key, or a scheduled server action).
  - On first load of the booking page, if slots for the current month don't exist, generate them on-demand.
- Each slot record represents a single 30-min window for a single type on a single date.
- Leaders/Superadmins can also **manually create custom special events** on top of the auto-generated slots (these use the existing `Event` model).

### 2.2 Slot Exclusivity

- **One user per slot** — once a slot is booked, no other user can claim it.
- A user **cannot book overlapping time slots across different activity types** on the same day. The API must enforce this cross-type overlap check.

### 2.3 Multi-Slot Booking

- Users can **select multiple consecutive 30-min slots in one booking action** (e.g., selecting 08:00–08:30 and 08:30–09:00 books a 1-hour block).
- The UI should support click-and-drag or shift-click range selection on the timeline.
- The API must accept an array of slot IDs and process them atomically (all-or-nothing).

### 2.4 Booking Limits

- Leaders/Superadmins can **configure a daily booking limit** per user. This limit is stored as an admin-configurable setting.
- The limit is **per-type per-day** (e.g., max 2 Bible slots/day, max 3 Prayer slots/day).
- A **global default limit** should exist (configurable via an admin settings model or `.env`), with the ability for Leaders to override per-type.
- The API must check and enforce this limit before confirming a booking.

### 2.5 Cancellation

- Users can **cancel their own bookings at any time** before the slot's start time.
- On cancellation:
  - The slot becomes available again for others.
  - A notification is sent to the user confirming cancellation.
  - A notification is sent to **all Leader and Superadmin role users** informing them of the cancellation (user name, slot type, date, time).
- Leaders/Superadmins can **assign any slot** (cancelled or uncancelled) to any user at any time, overriding any existing booking.
- Leaders/Superadmins can also **force-cancel** any user's booking.

### 2.6 Zoom / Microsoft Teams Links

- Each activity type has **one shared meeting link per type per day** (e.g., all Bible Reading slots on 2026-08-15 share a single Zoom URL).
- Only **Leader and Superadmin** roles can add, edit, or remove meeting links.
- Meeting links are stored on a per-type-per-date basis (see schema below).
- The link is displayed to users who have booked a slot for that type on that date.

### 2.7 Optional Booking Context

- When booking a slot, users may **optionally** provide additional context:
  - **Bible Reading**: passage/chapter they plan to read.
  - **Prayer**: prayer focus or topic.
  - **Praise & Worship**: worship theme or song list.
- This is a single optional `notes` text field on the booking form.

### 2.8 Timezone Handling

- All slots are stored and generated in **UTC**.
- The UI displays slot times converted to the **user's local timezone** (from their `UserProfile.timezone` or browser `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Date boundaries shift accordingly — a user in UTC+5 sees the 24-hour grid shifted so that UTC 00:00 shows as 05:00 local.
- The date picker and calendar views must account for this offset.

---

## 3. Slot Visibility Settings (Leader-Configurable)

Leaders/Superadmins can switch between four visibility modes for how booked slots appear to the community. This is a **system-level setting** (one active mode at a time):

| Mode | Name                  | Behaviour |
|------|-----------------------|-----------|
| 1    | **Full Public**       | User name + avatar visible on each booked slot. |
| 2    | **Count Only**        | Shows "Booked" badge but not who booked it. Available slots show as "Available". |
| 3    | **Full Transparency** | Shows who booked each slot, and empty slots are prominently marked "Available" with a CTA to book. |
| 4    | **Role-Scoped**       | Leaders/Coordinators see full details (who booked). Members only see their own bookings + whether a slot is available or taken. |

- Default mode: **Mode 4 (Role-Scoped)**.
- The setting is stored in a `SystemSetting` model (key-value store) or a dedicated admin config.
- The booking API and UI components must respect the active visibility mode.

---

## 4. Data Model Changes

### 4.1 New Model: `Slot`

Add to `prisma/schema.prisma`:

```prisma
model Slot {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  type      EventType                    // BIBLE | PRAYER | PRAISE_WORSHIP
  date      String                       // YYYY-MM-DD (UTC date)
  startTime String                       // HH:MM (UTC, e.g. "08:00")
  endTime   String                       // HH:MM (UTC, e.g. "08:30")
  bookedBy  String?                      // user.id of who booked it (null = available)
  notes     String?                      // optional context from user
  assignedBy String?                     // user.id of leader who assigned it (null = self-booked)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([type, date, startTime])      // one slot per type per date per time
  @@index([date])
  @@index([bookedBy])
  @@index([type, date])
}
```

### 4.2 New Model: `MeetingLink`

```prisma
model MeetingLink {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  type      EventType                    // BIBLE | PRAYER | PRAISE_WORSHIP
  date      String                       // YYYY-MM-DD
  url       String                       // Zoom or MS Teams URL
  label     String?                      // e.g. "Morning Zoom Room"
  createdBy String                       // leader/superadmin user.id
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([type, date])                 // one link per type per day
}
```

### 4.3 New Model: `BookingConfig`

```prisma
model BookingConfig {
  id                    String    @id @default(auto()) @map("_id") @db.ObjectId
  maxBibleSlotsPerDay   Int       @default(2)
  maxPrayerSlotsPerDay  Int       @default(2)
  maxWorshipSlotsPerDay Int       @default(2)
  visibilityMode        Int       @default(4)  // 1=Full Public, 2=Count Only, 3=Full Transparency, 4=Role-Scoped
  updatedBy             String                 // last admin who changed config
  updatedAt             DateTime  @updatedAt
  createdAt             DateTime  @default(now())
}
```

### 4.4 Existing Model Updates

- **`EventType` enum** already includes `BIBLE`, `PRAYER`, `PRAISE_WORSHIP` — no change needed.
- The existing `Event` and `EventBooking` models remain for leader-created special events (one-off meetings, retreats, etc.). The new `Slot` model is specifically for the auto-generated 30-min devotional grid.

---

## 5. Zod Schemas

Create `lib/schemas/slotSchema.ts`:

```typescript
import { z } from "zod";

export const slotTypeSchema = z.enum(["BIBLE", "PRAYER", "PRAISE_WORSHIP"]);

// Book one or more consecutive slots
export const bookSlotsSchema = z.object({
  slotIds: z.array(z.string().min(1)).min(1, "Select at least one slot"),
  notes: z.string().max(500).optional(),
});

// Cancel a booking
export const cancelSlotSchema = z.object({
  slotId: z.string().min(1),
});

// Admin: assign a slot to a user
export const assignSlotSchema = z.object({
  slotId: z.string().min(1),
  userId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

// Admin: force-cancel a slot
export const adminCancelSlotSchema = z.object({
  slotId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// Admin: update booking config
export const updateBookingConfigSchema = z.object({
  maxBibleSlotsPerDay: z.number().int().min(0).max(48).optional(),
  maxPrayerSlotsPerDay: z.number().int().min(0).max(48).optional(),
  maxWorshipSlotsPerDay: z.number().int().min(0).max(48).optional(),
  visibilityMode: z.number().int().min(1).max(4).optional(),
});

// Meeting link management (leader/superadmin only)
export const upsertMeetingLinkSchema = z.object({
  type: slotTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  url: z.string().url("Must be a valid URL"),
  label: z.string().max(100).optional(),
});

export type BookSlotsInput = z.infer<typeof bookSlotsSchema>;
export type CancelSlotInput = z.infer<typeof cancelSlotSchema>;
export type AssignSlotInput = z.infer<typeof assignSlotSchema>;
export type AdminCancelSlotInput = z.infer<typeof adminCancelSlotSchema>;
export type UpdateBookingConfigInput = z.infer<typeof updateBookingConfigSchema>;
export type UpsertMeetingLinkInput = z.infer<typeof upsertMeetingLinkSchema>;
```

---

## 6. API Routes

All routes under `app/api/v1/slots/`. Standard TGAW response format: `{ success, data, error }`.

### 6.1 Slot Listing & Browsing

#### `GET /api/v1/slots`

Query params: `date` (YYYY-MM-DD, required), `type` (optional filter).

Returns all 48 slots for the given date (or 144 if no type filter), with booking status respecting the active visibility mode. Include the meeting link for each type on that date.

Response shape:
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "id": "...",
        "type": "BIBLE",
        "date": "2026-08-15",
        "startTime": "08:00",
        "endTime": "08:30",
        "isBooked": true,
        "isOwnBooking": false,
        "bookedByName": "John D.",
        "bookedByImage": "...",
        "notes": "Genesis 1-3"
      }
    ],
    "meetingLinks": {
      "BIBLE": { "url": "https://zoom.us/...", "label": "Bible Room" },
      "PRAYER": null,
      "PRAISE_WORSHIP": { "url": "https://teams.microsoft.com/...", "label": "Worship Room" }
    },
    "config": {
      "maxBibleSlotsPerDay": 2,
      "maxPrayerSlotsPerDay": 2,
      "maxWorshipSlotsPerDay": 2,
      "visibilityMode": 4
    },
    "userBookingCounts": {
      "BIBLE": 1,
      "PRAYER": 0,
      "PRAISE_WORSHIP": 0
    }
  }
}
```

### 6.2 Booking Slots

#### `POST /api/v1/slots/book`

Body: `bookSlotsSchema`.

Validation checks (in order):
1. All slot IDs exist and belong to the same type and date.
2. All slots are consecutive (ordered by startTime).
3. None of the slots are already booked.
4. No cross-type overlap: the user has no bookings for a different type that overlap the requested time range on the same date.
5. Booking limit not exceeded for this type on this date.
6. Atomically mark all slots as booked with the current user's ID.

On success: create `Notification` records (email + push + SMS per user prefs) and return the booked slots.

### 6.3 Cancelling a Booking

#### `POST /api/v1/slots/cancel`

Body: `cancelSlotSchema`.

Validation:
1. Slot exists and is booked by the current user.
2. Slot start time is in the future.
3. Clear `bookedBy`, `notes`, and `assignedBy`.

On success:
- Notification to the user (cancellation confirmed).
- Notification to **all users with `leader` or `superadmin` role** (cancellation alert with user name, slot type, date, time).

### 6.4 Admin: Assign Slot

#### `POST /api/v1/slots/assign`  (Leader/Superadmin only)

Body: `assignSlotSchema`.

- Override any existing booking (if the slot was booked, notify the previous holder).
- Set `bookedBy` to the target user, `assignedBy` to the admin's user ID.
- Notify the assigned user.

### 6.5 Admin: Force-Cancel

#### `POST /api/v1/slots/admin-cancel`  (Leader/Superadmin only)

Body: `adminCancelSlotSchema`.

- Clear the booking.
- Notify the affected user with optional reason.

### 6.6 Slot Generation

#### `POST /api/v1/slots/generate`  (Internal / Cron-protected)

Protected by a `CRON_SECRET` header or Leader/Superadmin session.

- Generate all slots for the current month and next month that don't already exist.
- 48 slots × 3 types × N days = total slots created.
- Idempotent — skip any (type, date, startTime) that already exists.

### 6.7 Meeting Link Management

#### `PUT /api/v1/slots/meeting-link`  (Leader/Superadmin only)

Body: `upsertMeetingLinkSchema`.

Upsert: create or update the meeting link for a given type + date.

#### `DELETE /api/v1/slots/meeting-link`  (Leader/Superadmin only)

Query params: `type`, `date`.

### 6.8 Booking Config

#### `GET /api/v1/slots/config`  (Leader/Superadmin only)

Returns the current `BookingConfig`.

#### `PUT /api/v1/slots/config`  (Leader/Superadmin only)

Body: `updateBookingConfigSchema`.

---

## 7. Service Layer

Create `lib/services/slotService.ts`:

Key functions:
- `generateSlotsForDateRange(startDate, endDate)` — creates Slot records for all 3 types.
- `getSlotsForDate(date, type?, userId?, visibilityMode)` — fetches and formats slots respecting visibility.
- `bookSlots(slotIds, userId, notes?)` — atomic multi-slot booking with all validation.
- `cancelSlot(slotId, userId)` — self-cancellation with notifications.
- `adminAssignSlot(slotId, targetUserId, adminUserId, notes?)` — leader assignment.
- `adminCancelSlot(slotId, adminUserId, reason?)` — force cancellation.
- `getUserBookingCountForDate(userId, date, type)` — for limit enforcement.
- `checkCrossTypeOverlap(userId, date, startTime, endTime, excludeType)` — overlap guard.

---

## 8. Server Actions

Create `actions/slotActions.ts` with `"use server"` directive for any form mutations used by client components (e.g., `bookSlotAction`, `cancelSlotAction`). These should call the service layer and revalidate relevant paths.

---

## 9. UI Components & Pages

### 9.1 Unified Booking Page — `app/(dashboard)/booking/page.tsx`

Replace the current "Coming Soon" stub with a full booking interface:

**Layout (desktop):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: "Slot Booking"  +  Date Picker  +  Type Tabs  │
├──────────────────────────┬───────────────────────────────────┤
│                          │                                   │
│   Monthly Calendar       │   Daily Timeline (48 slots)       │
│   Mini-calendar showing  │   Vertical scrollable list of     │
│   days with booking      │   30-min slots for selected day   │
│   density indicators     │   + selected type tab             │
│                          │   Color-coded: booked / available │
│                          │   / own-booking / blocked          │
│                          │                                   │
├──────────────────────────┴───────────────────────────────────┤
│  My Bookings Summary  (upcoming bookings as cards)           │
│  Zoom/Meeting Link Card (if available for selected type/day) │
└──────────────────────────────────────────────────────────────┘
```

**Layout (mobile — stacked):**
```
┌─────────────────────────┐
│ Type Tabs (horizontal)  │
├─────────────────────────┤
│ Date Picker (compact)   │
├─────────────────────────┤
│ Daily Timeline          │
│ (scrollable list)       │
├─────────────────────────┤
│ My Bookings Cards       │
├─────────────────────────┤
│ Meeting Link Card       │
└─────────────────────────┘
```

**Key interactions:**
- Tab switching between Bible / Prayer / Worship types with `motion/react` animated transitions.
- Click a slot to select it. Shift-click or drag to select consecutive slots.
- Selected slots highlight with the type's accent colour.
- "Book Selected Slots" button appears as a sticky bottom bar when slots are selected.
- Booking dialog/sheet opens with: selected time range summary, optional notes textarea, confirm button.
- After booking: toast notification, slots update to "booked" state, "My Bookings" section updates.

### 9.2 Devotion Page Integration

Each devotion page (`/bible`, `/prayer`, `/worship`) gets a **"Book a Slot" section**:

- Shows today's date with a compact horizontal timeline of 48 slots for that type.
- Quick-book: tap an available slot, confirm in a sheet.
- "View Full Calendar →" link navigates to `/booking` with the correct type tab pre-selected.
- Below the booking strip: "Your Upcoming Slots" — cards for the user's next 3 booked slots of this type.
- Meeting link card (if a Zoom/Teams link exists for today + this type).

### 9.3 Calendar Page Integration — `app/(dashboard)/calendar/page.tsx`

- All booked slots across all types for the logged-in user should appear as events on the calendar.
- All community bookings should be visible (per the active visibility mode) so users can see coverage gaps.

### 9.4 Admin: Booking Management

On the Admin Portal (`/admin`), add a **"Slot Management"** section (tab or sub-page):

- **Booking Config panel**: form to update `maxBibleSlotsPerDay`, `maxPrayerSlotsPerDay`, `maxWorshipSlotsPerDay`, and `visibilityMode` (radio group with descriptions of each mode).
- **Meeting Link Manager**: date picker + type selector → input field for URL + label. Save/delete buttons.
- **Slot Override tool**: search for a user, pick a date/type/time, assign them to a slot or force-cancel. Shows a mini timeline.
- **Slot Generation trigger**: a "Generate Slots" button with a date range picker to manually trigger generation.
- **Booking Stats**: simple dashboard showing total bookings today, this week, this month, broken down by type. Coverage percentage (booked / total slots).

### 9.5 Component Breakdown

Create under `components/booking/`:

| Component | Description |
|-----------|-------------|
| `SlotTimeline.tsx` | Vertical scrollable list of 48 slots for a single date + type. Renders `SlotCell` for each. Handles multi-select. |
| `SlotCell.tsx` | Individual slot row: time label, status badge (Available/Booked/Mine), user avatar (if visible), click handler. |
| `SlotBookingSheet.tsx` | Bottom sheet / dialog for confirming a booking: shows time range, notes input, confirm/cancel buttons. |
| `TypeTabs.tsx` | Horizontal tab group for BIBLE / PRAYER / PRAISE_WORSHIP with icons + accent colours. |
| `BookingCalendarMini.tsx` | Month mini-calendar with dots/heat indicators showing booking density per day. |
| `MyBookingsCards.tsx` | List of the current user's upcoming bookings as dismissible cards with cancel button. |
| `MeetingLinkCard.tsx` | Card showing the Zoom/Teams link for a given type + date, with copy-to-clipboard and open-in-new-tab. |
| `SlotBookingStrip.tsx` | Compact horizontal timeline for embedding in devotion pages (Bible, Prayer, Worship). |
| `AdminBookingConfig.tsx` | Form for Leaders/Superadmins to update booking limits and visibility mode. |
| `AdminMeetingLinkManager.tsx` | Form for managing per-type-per-date meeting links. |
| `AdminSlotOverride.tsx` | UI for assigning/force-cancelling slots. |

---

## 10. Notifications

### 10.1 Notification Events

| Event | Recipients | Channels | Template Content |
|-------|-----------|----------|-----------------|
| Slot Booked | Booking user | Email, Push, SMS (per user prefs) | "You've booked [Type] on [Date] at [Time (local)]." |
| Slot Cancelled (self) | Cancelling user | Email, Push | "Your [Type] booking on [Date] at [Time] has been cancelled." |
| Slot Cancelled (alert) | All Leaders + Superadmins | Push | "[User Name] cancelled their [Type] slot on [Date] at [Time]." |
| Slot Assigned (admin) | Assigned user | Email, Push, SMS (per user prefs) | "A [Type] slot on [Date] at [Time] has been assigned to you by [Admin Name]." |
| Slot Force-Cancelled | Affected user | Email, Push | "Your [Type] booking on [Date] at [Time] was cancelled by an admin. Reason: [reason]." |
| Slot Reminder | Booking user | Push | "Your [Type] session starts in 15 minutes! [Zoom link if available]" |

### 10.2 Notification Preferences Override

All notifications must respect the user's notification preferences stored in `User.notificationPrefs` (JSON field). If a user has disabled email notifications, do not send email — only send via enabled channels. The `/settings` page must include toggles for:
- Booking confirmations (email, push, SMS)
- Booking reminders (push)
- Cancellation alerts (email, push)

### 10.3 Calendar Integration

Every confirmed booking must appear as an entry on the `/calendar` page for the entire community to see (respecting the visibility mode for who booked it). Use the existing calendar component infrastructure.

---

## 11. Sidebar Navigation Update

Add a **"Booking"** item to the sidebar under the **Devotion** group in `components/app-sidebar.tsx`:

```typescript
{
  title: "Slot Booking",
  url: "/booking",
  icon: <CalendarCheck className="size-4" />,
},
```

Place it after "Praise & Worship" in the Devotion sub-items. Import `CalendarCheck` from `lucide-react`.

---

## 12. RBAC & Route Protection

Update `proxy.ts` to protect booking admin routes:

| Route Pattern | Allowed Roles |
|--------------|---------------|
| `/booking` | All authenticated users |
| `/api/v1/slots` (GET) | All authenticated users |
| `/api/v1/slots/book` | All authenticated users |
| `/api/v1/slots/cancel` | All authenticated users |
| `/api/v1/slots/assign` | `leader`, `superadmin` |
| `/api/v1/slots/admin-cancel` | `leader`, `superadmin` |
| `/api/v1/slots/config` | `leader`, `superadmin` |
| `/api/v1/slots/meeting-link` | `leader`, `superadmin` |
| `/api/v1/slots/generate` | `leader`, `superadmin`, or CRON_SECRET |

---

## 13. UX / Design Requirements

Adhere to TGAW's premium quality bar as specified in `AGENTS.md`:

1. **shadcn/ui primitives only**: Card, Tabs, Button, Sheet, Dialog, Badge, Calendar, Tooltip, Skeleton, Toast. Use `cn()` for conditional classes.
2. **Semantic colour tokens**: `bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`, etc. Use type accent colours (`purple-500`, `red-500`, `amber-500`) only for left-border accents and badges.
3. **Micro-animations**: Use `motion/react` for tab transitions, slot selection feedback, booking confirmation. Respect `prefers-reduced-motion`.
4. **Loading states**: Skeleton loaders for the slot timeline while fetching. Skeleton for calendar mini-view.
5. **Empty states**: When a day has no bookings, show an illustrated empty state with "No slots booked yet — be the first!" CTA.
6. **Error states**: Inline error toasts for booking failures (slot taken, limit exceeded, overlap). Never show raw error objects.
7. **Mobile-first**: The daily timeline must be touch-friendly. Slot cells ≥ 44px height. The multi-select interaction must work on touch (long-press to start range select, drag to extend).
8. **Accessibility**: All slot cells must be keyboard navigable. Screen reader announcements for booking status. ARIA labels on all interactive elements.

---

## 14. Implementation Order

1. **Prisma schema** — Add `Slot`, `MeetingLink`, `BookingConfig` models. Run `bunx prisma generate` and `bunx prisma db push`.
2. **Zod schemas** — Create `lib/schemas/slotSchema.ts`.
3. **Service layer** — Create `lib/services/slotService.ts` with all business logic.
4. **API routes** — Build all `/api/v1/slots/*` routes.
5. **Server actions** — Create `actions/slotActions.ts`.
6. **UI components** — Build all components under `components/booking/`.
7. **Booking page** — Replace the stub at `app/(dashboard)/booking/page.tsx`.
8. **Devotion page integration** — Add `SlotBookingStrip` to `/bible`, `/prayer`, `/worship` pages.
9. **Admin panel** — Add booking management to `/admin`.
10. **Calendar integration** — Show bookings on the calendar page.
11. **Sidebar update** — Add Booking nav item.
12. **Notification wiring** — Connect booking events to the notification dispatch system.
13. **Route protection** — Update `proxy.ts`.
14. **Testing & verification** — Run all checks from Section 15.

---

## 15. Testing & Verification

- **API tests**: Verify all booking rules (exclusivity, overlap, limits, cancellation, admin overrides) via API calls.
- **UI smoke test**: Book a slot, verify it appears as booked, cancel it, verify it's available again.
- **Timezone test**: Set browser timezone to UTC+5, verify the timeline shows correctly shifted times and the correct UTC date is sent to the API.
- **Visibility mode test**: Switch between all 4 modes and verify slot display changes accordingly.
- **Mobile responsiveness**: Test on 360px, 390px, 768px, 1024px, 1440px viewports.
- **Accessibility audit**: Keyboard navigation through all 48 slots, screen reader announces slot state.
- **Notification test**: Book a slot, verify email/push/SMS sent (per user prefs). Cancel a slot, verify leader notification.

---

## 16. Environment Variables

Add to `.env.example`:

```env
# Booking slot generation cron secret
CRON_SECRET=your-cron-secret-here

# Default booking limits (overridable via admin UI)
DEFAULT_MAX_BIBLE_SLOTS_PER_DAY=2
DEFAULT_MAX_PRAYER_SLOTS_PER_DAY=2
DEFAULT_MAX_WORSHIP_SLOTS_PER_DAY=2
```
