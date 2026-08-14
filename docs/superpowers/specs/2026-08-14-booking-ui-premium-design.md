# Premium Booking UI — Design Spec

**Date**: 2026-08-14
**Scope**: `/booking` page + shared booking components (`components/booking/*`). Admin panels and devotion-page strips are out of scope (covered by a later pass).
**Approach**: **A — Refined Timeline**. Keep the vertical 48-slot list (preserves shift-click consecutive multi-select) and elevate craft around it. The centerpiece is converting the broken bottom-`Sheet` confirmation into a **centered Dialog**.

## Context

- The current `/booking` page works but is visually flat: `SlotCell` rows are bare `border-b` lines, `TypeTabs` is a plain 3-col grid, the confirmation uses `Sheet` with invalid classes (`sm:side-right sm:bottom-auto` — non-existent Tailwind classes), and there are no loading/empty states beyond raw text.
- `motion/react` is installed and already used in `app/(dashboard)/settings/page.tsx` (`AnimatePresence`, `motion`, `useReducedMotion`) and `components/shadcn-space/tabs/tabs-07.tsx` (spring `layoutId` indicator). Follow those patterns.
- Theme uses oklch shadcn tokens (`bg-card`, `bg-muted`, `bg-popover`, `border-border`, `text-muted-foreground`, `bg-primary`). Accent colours are per-type Tailwind hues (`purple-500` Bible, `red-500` Prayer, `amber-500` Worship) — keep them **only** for left-rail accents, selection highlights, and status badges; never as fills.
- `SlotBookingSheet` is shared by the `/booking` page and `SlotBookingStrip` (devotion pages). Convert it to a centered Dialog so both benefit — but keep the devotion-page strip itself unchanged (out of scope).

## Design Details

### 1. Centered Confirmation Dialog (`SlotBookingSheet` → Dialog)

Replace `Sheet` with shadcn `Dialog` (default is already centered: `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, `sm:max-w-sm`). The dialog body:

- **Header**: type icon in a soft accent-tinted square (`bg-purple-100`/`red-100`/`amber-100`, `text-purple-700` etc. — same pattern as `TypeTabs`), `DialogTitle` = "Confirm Your [Type] Slot", `DialogDescription` = humanized date.
- **Range summary strip**: a rounded `bg-muted` card showing the selected block — start → end time (local), duration (N × 30 min), date. For a single slot show `startTime – endTime`.
- **Notes textarea**: unchanged behaviour (type-specific placeholder), `maxLength={500}`, resize-none.
- **Footer**: right-aligned on desktop, stacked on mobile — `Cancel` (outline) + `Confirm Booking` (`bg-primary`, loading state shows spinner/"Booking…").
- **Motion**: rely on Dialog's built-in `animate-in:zoom-in-95` + `fade-in-0` (already in `dialog.tsx`). No extra `motion` needed inside. `useReducedMotion` is handled by the Radix animation classes.
- Accessible: `aria-describedby` via `DialogDescription`; focus trapped by Radix automatically.

### 1b. Centered Cancel Confirmation (`AlertDialog`)

Replace both `window.confirm` browser dialogs with a centered shadcn `AlertDialog` (default content is already centered: `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`):

- **Cancel booking** (`app/(dashboard)/booking/page.tsx:80`): opens when the user clicks "Cancel" on one of their bookings. Title "Cancel this booking?", body shows the slot time range, footer `Keep booking` (outline) + `Cancel booking` (destructive). On confirm, calls the existing `cancelSlotAction` and closes.
- **Delete meeting link** (`components/booking/AdminMeetingLinkManager.tsx:55`): opens when a leader deletes a link. Title "Delete meeting link?", destructive confirm. **Only the browser-confirm swap is in scope here** — the rest of the admin component styling stays as-is for the later pass.

### 2. Slot Timeline (`SlotTimeline` + `SlotCell`)

- **Grouped sections**: split the 48 slots into Morning (`05:00–11:30`), Midday (`12:00–16:30`), Afternoon/Eve (`17:00–20:30`), Night (`21:00–04:30`) by local time. Render a slim sticky section header (`text-xs uppercase tracking-wide text-muted-foreground`) above each group. Sections computed from the same `convertUtcTimeToLocal` source so grouping is timezone-correct.
- **SlotCell redesign**:
  - Time column: `tabular-nums`, mono-ish, `font-medium text-sm`; add a faint "axis rail" border on the left (`border-l border-border/60`).
  - Status column: 
    - **Available** → right-aligned subtle `+` affordance / "Available" text in `text-muted-foreground`, hover reveals a soft accent background + accent left-rail.
    - **Booked (others)** → muted, `opacity-60`, "Booked" badge `variant="secondary"`, avatar + name shown only when `bookedByName` is visible (respecting visibility mode already handled server-side).
    - **My booking** → accent-tinted left-rail + `bg-{accent}/5`, "My Booking" badge in accent colour.
  - **Selected** → `bg-{accent}/10`, `border-l-4` accent, a small check icon on the right.
- **Motion**: selected slot animates with `motion.div layout` spring; when `selectedIds` changes, AnimatePresence not needed (single-row highlight). Keep it subtle — no per-row entrance animation for 48 rows (perf).
- **Empty state**: when `slots.length === 0`, show an illustrated empty state (icon + "No slots here yet" + CTA to another day) instead of raw "No slots available." text.
- **Loading**: the page already shows `Skeleton` rows; keep but ensure they fill the timeline height rhythmically.

### 3. Type Tabs (`TypeTabs`)

- Keep 3-col `TabsList` but add a `motion.div layoutId` sliding indicator (per the `tabs-07.tsx` pattern) tinted with the active type's accent colour. Reduce reliance on `data-[state=active]:bg-*` background fills — use the animated indicator + accent text/icon colour instead. Respect `prefers-reduced-motion` (if reduced, fall back to static accent classes).

### 4. Booking Calendar Mini (`BookingCalendarMini`)

- Add **booking-density dots** under dates. Data source: the page tracks every date whose slots it has already loaded this session (today on mount + the selected date on change) and derives `bookedDates: Set<string>` / `myBookedDates: Set<string>` from the `isBooked`/`isOwnBooking` flags of those responses — see Data Flow. Days in `bookedDates` render a small accent dot; days in `myBookedDates` render a stronger filled dot. No extra network calls; dots honestly cover only the dates actually loaded (today + selected). Today and the selected date also get a subtle ring regardless of bookings. Default shadcn `Calendar` styling otherwise.
- Wrap in a `Card` with a `CardHeader` ("Pick a day") for a cohesive look.

### 5. My Bookings Cards (`MyBookingsCards`)

- Upgrade to premium cards: accent left-rail (`border-l-2 border-l-{accent}`), time range in `font-semibold tabular-nums`, notes in `text-sm text-muted-foreground line-clamp-2`, and a trailing "Cancel" ghost/outline button that turns destructive on hover. Empty state gets an icon + friendly copy ("No bookings for this day — claim a slot!").

### 6. Meeting Link Card (`MeetingLinkCard`)

- Keep the `bg-primary/5 border-primary/20` tint. Add a small `Badge` ("Live" or "Meeting") and a `Video` icon avatar for visual weight. Copy button keeps toast feedback.

### 7. Booking Page Header + Layout polish (`app/(dashboard)/booking/page.tsx`)

- Page header: keep title, but add a date line and a subtle `Badge` showing the active type. Consistent spacing rhythm (`space-y-6`).
- Add the `bookedDates` fetch (see Data Flow) so the calendar dots render.
- Keep the sticky "Book Selected" bar (it works well); restyle with the accent colour and `motion` fade/slide-in when it appears, slide-out when cleared. Respect reduced motion.
- Errors from `bookSlotAction`/`cancelSlotAction` remain toast-driven (already done).

## Data Flow

- `GET /api/v1/slots?date=YYYY-MM-DD&type=…` response is unchanged (slots, meetingLinks, config, userBookingCounts). No backend changes.
- For calendar density dots, the page derives `bookedDates` / `myBookedDates` from slot responses already fetched this session (today on mount + the selected date on each change) — zero additional network calls. `BookingCalendarMini` takes these two `Set<string>` props plus the `type` accent colour. No whole-month prefetch (avoids a 31-request blast); dots cover exactly the days actually loaded.
- `SlotBookingSheet` props stay identical (`open`, `onOpenChange`, `selectedSlots`, `type`, `onConfirm`, `isSubmitting`) so `SlotBookingStrip` keeps working unchanged.

## Component Inventory

| Component | Change |
|---|---|
| `SlotBookingSheet.tsx` | Rewrite as centered `Dialog` with range summary strip + accent header |
| `app/(dashboard)/booking/page.tsx` | Header polish, density data wiring, sticky-bar motion, empty-state CTA, cancel-confirm `AlertDialog` |
| `components/booking/AdminMeetingLinkManager.tsx` | Swap `window.confirm` → centered `AlertDialog` only (rest unchanged) |
| `SlotTimeline.tsx` | Add section grouping + sticky headers; keep selection logic |
| `SlotCell.tsx` | Redesign row (rail, status affordances, selection check, motion highlight) |
| `TypeTabs.tsx` | Add motion `layoutId` indicator; keep 3-col grid |
| `BookingCalendarMini.tsx` | Card wrapper + density dots + selected/today ring |
| `MyBookingsCards.tsx` | Premium card styling + empty state |
| `MeetingLinkCard.tsx` | Add badge + Video icon; keep tint |
| `app/(dashboard)/booking/page.tsx` | Header polish, density data wiring, sticky-bar motion, empty-state CTA |

## Out of Scope

- `SlotBookingStrip` (devotion pages), `AdminBookingConfig`, `AdminSlotOverride` styling — separate pass. (`AdminMeetingLinkManager` is covered only for the `window.confirm` → `AlertDialog` swap above.)
- Any backend/API/schema changes.

## Verification

- `bun run typecheck` and `bun run build` pass.
- Manual: open `/booking`, select 1 and multiple consecutive slots (shift-click), confirm via centered Dialog, verify toast + slot flips to "My Booking"; cancel it. Check calendar dots, empty day, narrow viewport (360px) no horizontal overflow, dark mode.
- Confirm Dialog is centered and scrolls internally on short viewports (no clipping of footer).
