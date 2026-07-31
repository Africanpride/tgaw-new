# Task 3-4-5: Rewrite Sidebar Components with TGAW Navigation

## What Was Implemented

Replaced the sidebar-07 sample data (Playground, Acme Inc, etc.) with TGAW's actual navigation structure.

### Task 3: `components/app-sidebar.tsx`
- Removed `TeamSwitcher` and `NavProjects` imports and usage
- Added `role` prop for RBAC (already passed from dashboard layout)
- Defined TGAW navigation items: Overview, Devotion, Community, Account, Admin
- Admin section conditionally shown based on role (`moderator` or `admin`)
- Header shows TGAW brand icon (`ShieldUserIcon`) + "TGAW" text
- Kept `collapsible="icon"` and `<SidebarRail />`

### Task 4: `components/nav-main.tsx`
- Added `Link` from `next/link` and `usePathname` from `next/navigation`
- Removed "Platform" label
- Implemented `isActive` detection using `pathname === item.url`
- Overview renders as a direct `<Link>` (no collapsible)
- Devotion/Community/Account/Admin render as collapsible groups with sub-items
- Sub-items use `<Link href={...} className="cursor-pointer" />`
- Uses base-ui `render` prop pattern (not radix `asChild`)

### Task 5: `components/nav-user.tsx`
- Uses `useSession` from `@/lib/auth-client` (no props, no hardcoded data)
- Uses `signOut` from `@/lib/auth-client` for sign out
- Shows user initials in `AvatarFallback`
- Shows user name and role
- Dropdown menu: Profile (→ `/settings`) and Sign out
- Uses Hugeicons for menu icons

## Files Changed
- `components/app-sidebar.tsx`
- `components/nav-main.tsx`
- `components/nav-user.tsx`

## Lint/Typecheck Results
- **Typecheck**: Passes (`tsc --noEmit` clean)
- **Lint**: Only pre-existing issues remain (unused `Inter` in layout.tsx, `use-mobile.ts` setState warning). No new warnings from these files.

## Notes
- The project uses `@base-ui/react` (not radix), so components use `render` prop instead of `asChild`. This was discovered during typecheck and fixed accordingly.
- Icons chosen: `Home02Icon` (Overview), `BookOpen01Icon` (Devotion), `Chat01Icon` (Community), `Settings05Icon` (Account), `Shield01Icon` (Admin), `ShieldUserIcon` (TGAW brand)
