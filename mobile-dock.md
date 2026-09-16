# Mobile Dock — Design Spec

> **Component**: `MobileDock`
> **Location**: `components/dashboard/MobileDock.tsx`
> **Visibility**: `< md` breakpoint only (< 768px) — phones + small portrait tablets
> **Scope**: All authenticated `(dashboard)` pages

---

## 1. Overview

A fixed bottom navigation dock that provides thumb-friendly access to the five most-used destinations in TGAW on mobile devices. It replaces the desktop sidebar as the primary navigation mechanism below the `md` breakpoint.

### Why these 5 tabs?

| Tab | Route | Icon (Lucide) | Rationale |
|---|---|---|---|
| **Home** | `/overview` | `Home` | Dashboard hub — greeting, stats, agenda, verse of the day |
| **Feed** | `/feed` | `PenSquare` | Community content — posts, prayers, testimonials |
| **Booking** | `/booking` | `CalendarCheck` | Core app action — slot booking for Bible/Prayer/Worship |
| **Messages** | `/messages` | `MessageSquare` | 1-1 and group chat — high-frequency destination |
| **Profile** | `/settings` | User avatar / initials | Account, settings, preferences — mirrors NavUser |

> **Notifications** are intentionally omitted from the dock — they remain accessible via the Topbar bell icon, which is always visible. This avoids duplicating the notification entry point and keeps the dock focused on _destinations_ not _alerts_.

---

## 2. Visual Design

### 2.1 Layout

```
┌─────────────────────────────────────────────────┐
│  [pill]                                         │  ← active indicator pill (animated)
│  🏠        ✏️        📅        💬        👤      │  ← icons (size-5, 20×20)
│  Home     Feed    Booking  Messages  Profile    │  ← labels (10px, font-medium)
│                                                 │
│  ████████ safe area inset ████████████████████  │  ← env(safe-area-inset-bottom)
└─────────────────────────────────────────────────┘
```

### 2.2 Container

- **Position**: `fixed bottom-0 left-0 right-0` with `z-50`
- **Background**: `bg-card` with `border-t border-border`
- **Safe area**: Bottom padding uses `pb-[env(safe-area-inset-bottom)]` for notched devices
- **Height**: Auto (icon + label + padding ≈ 56px + safe area)
- **Hidden at ≥ md**: `md:hidden` — dock is invisible on desktop/tablet landscape

### 2.3 Tab Button

- **Layout**: `flex flex-col items-center gap-1 py-2` inside a 5-column grid (`grid grid-cols-5`)
- **Touch target**: Full column width, min 44px height — meets a11y guidelines
- **Icon**: Lucide, `size-5` (20×20)
  - **Active**: `stroke-width="2"`, `text-foreground`
  - **Inactive**: `stroke-width="1.5"`, `text-muted-foreground`
- **Label**: `text-[10px] font-medium`
  - **Active**: `text-foreground`
  - **Inactive**: `text-muted-foreground`

### 2.4 Active Indicator Pill

- **Shape**: 2px tall, 32px wide (`h-0.5 w-8`), `rounded-full`
- **Color**: `bg-foreground`
- **Position**: Absolute, pinned to the top edge of the active tab button
- **Animation**: Uses `motion/react` `layoutId` for a smooth sliding transition between tabs. Spring physics: `type: "spring", stiffness: 500, damping: 35` — snappy but not jarring
- **Respects `prefers-reduced-motion`**: Falls back to instant swap (no animation) when the user has reduced motion enabled

### 2.5 Profile Tab — User Avatar

- **With image**: 20×20 rounded-full `next/image` of the user's avatar, with a 2px ring in active state (`ring-2 ring-foreground`)
- **Without image**: 20×20 rounded-full `bg-muted` circle with the user's initials (derived from `session.user.name`), 8px `text-muted-foreground` text
- **Active state**: Ring appears, initials text becomes `text-foreground`

### 2.6 Notification Badges

Badges appear as small dots/counts overlaid on the icon:

| Tab | Badge source | Format |
|---|---|---|
| **Home** | Pending sessions today (from overview stats) | Numeric count (e.g. `3`) — capped at `9+` |
| **Messages** | Unread message count | Numeric count — capped at `9+` |

- **Badge style**: `absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1`
- **Zero count**: Badge is hidden (not rendered)
- **Data source**: Client-side fetch or context — no blocking the dock render

---

## 3. Behavior

### 3.1 Navigation

- Each tab is a `<Link>` from `next/link` — enables client-side navigation with prefetching
- Active tab is determined by matching `usePathname()` against the tab's `href`:
  - Exact match for `/overview`, `/booking`, `/settings`
  - Starts-with match for `/feed` (covers `/feed/[id]` etc.) and `/messages` (covers `/messages/[conversationId]`)

### 3.2 Haptic Feedback (future)

- Placeholder hook `useHaptic()` — no-op on web, can be wired to native haptics when wrapped in Capacitor/React Native

### 3.3 Content Padding

- The dashboard `<main>` element needs `pb-[72px] md:pb-0` to prevent content from being hidden behind the fixed dock on mobile

### 3.4 Sidebar Interaction

- On mobile (< md), the sidebar is already a sheet overlay triggered by `SidebarTrigger`. The dock does **not** replace the sidebar — both coexist:
  - Dock = primary navigation for top-5 destinations
  - Sidebar = full navigation tree (all pages + role-based sections)
- When the sidebar sheet is open, the dock remains visible beneath it (sidebar has its own `z-50` overlay)

---

## 4. Accessibility

- `<nav aria-label="Mobile navigation">` wrapping the grid
- Each tab button: `role="link"` (since they navigate), or rendered as actual `<Link>` elements
- Active tab: `aria-current="page"`
- All Lucide icons: `aria-hidden="true"`
- Badge counts: `<span className="sr-only">3 unread messages</span>` alongside the visual badge
- Keyboard navigable: Tab key traverses all 5 items, Enter/Space activates
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

---

## 5. Component API

```tsx
// No props needed — reads pathname from router, session from auth context
<MobileDock />
```

### Internal State

| State | Source | Purpose |
|---|---|---|
| `pathname` | `usePathname()` | Determine active tab |
| `session` | `useSession()` from `lib/auth-client` | User avatar, name, initials |
| `unreadMessages` | Client-side fetch or context (TBD) | Messages badge count |
| `todaySessions` | Client-side fetch or context (TBD) | Home badge count |

---

## 6. Integration Points

### 6.1 Dashboard Layout (`app/(dashboard)/layout.tsx`)

```tsx
// Add MobileDock at the end of the layout, inside SidebarProvider
<div className="flex min-w-0 flex-1 flex-col">
  <Topbar />
  <main id="main-content" className="flex-1 p-4 pb-20 md:pb-4 lg:p-6 lg:pb-6">
    <PageTransition>{children}</PageTransition>
  </main>
</div>
<MobileDock />  {/* ← new: fixed bottom, md:hidden */}
```

### 6.2 Dependencies

- `motion/react` — already used in the project for `PageTransition`
- `next/link`, `next/navigation` — standard Next.js
- `lucide-react` — existing icon library
- `@/lib/auth-client` — for `useSession()`
- `@/components/ui/avatar` — for the profile tab avatar (shadcn primitive)

### 6.3 Files to Create/Modify

| Action | File | Description |
|---|---|---|
| **CREATE** | `components/dashboard/MobileDock.tsx` | The dock component |
| **MODIFY** | `app/(dashboard)/layout.tsx` | Import + render `<MobileDock />`, add `pb-20 md:pb-4` to main |

---

## 7. Design Tokens Used

All styling uses shadcn semantic tokens — no ad-hoc hex colors:

- `bg-card`, `border-border` — container
- `text-foreground`, `text-muted-foreground` — active/inactive text + icons
- `bg-foreground` — active indicator pill
- `bg-destructive`, `text-destructive-foreground` — notification badges
- `bg-muted` — avatar fallback background
- `ring-foreground`, `ring-ring` — focus + active avatar ring

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| User on a page not matching any tab (e.g. `/admin`) | No tab is highlighted — all tabs show inactive state |
| User resizes from mobile → desktop | Dock disappears via `md:hidden`, sidebar takes over |
| User has no avatar image | Profile tab shows initials circle |
| User has no name | Initials fallback to `"?"` (matching existing `deriveInitials` logic) |
| iOS notch / Android gesture bar | `env(safe-area-inset-bottom)` provides spacing |
| Badge count > 99 | Display `9+` (capped) |
| Reduced motion preference | `layoutId` animation disabled, instant pill swap |
