# Design: sidebar-07 Integration for TGAW Dashboard

## Goal

Replace the current sidebar implementation with shadcn's sidebar-07 block, which provides a sidebar that collapses to icons. Adapt the block's sample data to match TGAW's existing navigation structure.

## What sidebar-07 Provides

- `<Sidebar collapsible="icon">` — collapses to icon-only view on toggle
- `<SidebarRail>` — drag-to-resize handle on sidebar edge
- `TeamSwitcher` component — workspace switcher (will be replaced with TGAW brand)
- `NavMain` — collapsible navigation groups with sub-items
- `NavProjects` — pinned projects section (will be removed for TGAW)
- `NavUser` — user menu in footer
- Uses **Hugeicons** (already configured in `components.json`)

## Steps

### 1. Install sidebar-07

```bash
npx shadcn@latest add sidebar-07
```

This installs 18 files. 5 will overwrite existing components, 12 skip (already identical).

### 2. Delete demo page

Delete `app/dashboard/page.tsx` — the block creates a demo page that conflicts with the existing route structure at `app/(dashboard)/`.

### 3. Rewrite `components/app-sidebar.tsx`

- Replace sample data (`Playground`, `Models`, `Acme Inc`, etc.) with TGAW nav items
- Keep `role` prop for RBAC (admin/moderator sections)
- Header shows TGAW brand text only (no TeamSwitcher dropdown)
- Structure: `<Sidebar collapsible="icon">` with `<SidebarHeader>`, `<SidebarContent>`, `<SidebarFooter>`, `<SidebarRail>`

### 4. Delete `components/team-switcher.tsx`

Replaced by inline TGAW brand in `app-sidebar.tsx`.

### 5. Rewrite `components/nav-main.tsx`

- Accept TGAW nav groups: Devotion, Community, Account, Admin
- Each group has `title`, `icon`, and `items` array
- Use `Link` components for navigation (not `#` anchors)
- Use `isActive` prop based on `usePathname()`

### 6. Remove `components/nav-projects.tsx`

TGAW doesn't need a "pinned projects" section.

### 7. Rewrite `components/nav-user.tsx`

- Accept session user data (`name`, `email`, `image`) instead of hardcoded `shadcn`
- Keep dropdown menu with Settings, Sign Out actions

### 8. Update `app/(dashboard)/layout.tsx`

- No structural changes needed — existing auth guard and `SidebarProvider` stay
- Add `<SidebarTrigger />` in Topbar for mobile toggle

### 9. Update `components/dashboard/Topbar.tsx`

- Add `<SidebarTrigger />` button for toggling sidebar on mobile

## Navigation Structure

```
Overview        → /
Devotion
  ├─ Calendar       → /calendar
  ├─ Bible Reading  → /bible
  ├─ Prayer         → /prayer
  ├─ Praise & Worship → /worship
  └─ Book a Slot    → /booking
Community
  ├─ Feed           → /feed
  ├─ Messages       → /messages
  └─ Groups         → /groups
Account
  ├─ Settings       → /settings
  └─ Notifications  → /notifications
Admin (moderator + admin only)
  ├─ Admin Portal   → /admin
  ├─ Moderation Queue → /admin/reports
  └─ User Management (admin only) → /admin/users
```

## Files Changed

| File | Action |
|------|--------|
| `app/dashboard/page.tsx` | Delete |
| `components/app-sidebar.tsx` | Rewrite |
| `components/team-switcher.tsx` | Delete |
| `components/nav-main.tsx` | Rewrite |
| `components/nav-projects.tsx` | Delete |
| `components/nav-user.tsx` | Rewrite |
| `components/dashboard/Topbar.tsx` | Update (add SidebarTrigger) |
| `app/(dashboard)/layout.tsx` | Minor update |

## Verification

1. `bun run check` — lint and format pass
2. `bun run build` — no build errors
3. Manual: sidebar toggles between expanded and icon-collapsed state
4. Manual: all nav links work correctly
5. Manual: RBAC — admin-only items hidden for `member` role
6. Manual: mobile view — sidebar collapses to sheet, trigger in topbar
