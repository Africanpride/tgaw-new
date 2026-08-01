# sidebar-07 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current sidebar with shadcn's sidebar-07 block that collapses to icons, adapted with TGAW navigation.

**Architecture:** Install the sidebar-07 block, delete demo/unused files, rewrite `app-sidebar.tsx` with TGAW nav data and `collapsible="icon"`, remove TeamSwitcher/NavProjects, and adapt NavUser to use session data.

**Tech Stack:** Next.js 16, shadcn/ui sidebar component, Hugeicons, Better Auth (session)

## Global Constraints

- Bun runtime, ES2026+, strict TypeScript
- shadcn/ui components with Tailwind CSS v4
- Use `Link` from `next/link` with `className="cursor-pointer"` for all navigation
- Use `usePathname()` for `isActive` detection
- RBAC: admin-only items conditionally rendered based on `role` prop
- `no-console` lint rule enforced

---

## File Structure

| File                              | Action                   | Responsibility                                        |
| --------------------------------- | ------------------------ | ----------------------------------------------------- |
| `components/ui/sidebar.tsx`       | Skip (already installed) | Sidebar primitives                                    |
| `app/dashboard/page.tsx`          | Delete                   | Remove demo page                                      |
| `components/app-sidebar.tsx`      | Rewrite                  | Main sidebar with `collapsible="icon"`, TGAW nav data |
| `components/team-switcher.tsx`    | Delete                   | Not needed for TGAW                                   |
| `components/nav-main.tsx`         | Rewrite                  | Collapsible nav groups with TGAW items                |
| `components/nav-projects.tsx`     | Delete                   | TGAW doesn't need projects section                    |
| `components/nav-user.tsx`         | Rewrite                  | Accept user prop, use Hugeicons                       |
| `components/dashboard/Topbar.tsx` | No change                | Already has SidebarTrigger                            |

---

### Task 1: Install sidebar-07 block

**Files:**

- Modify: `components/ui/sidebar.tsx` (skip — already identical)
- Modify: `components/ui/button.tsx` (skip — already identical)
- Modify: `components/ui/input.tsx` (skip — already identical)
- Modify: `components/ui/separator.tsx` (skip — already identical)
- Modify: `components/ui/skeleton.tsx` (skip — already identical)
- Modify: `components/ui/tooltip.tsx` (skip — already identical)
- Modify: `components/ui/breadcrumb.tsx` (skip — already identical)
- Modify: `components/ui/collapsible.tsx` (skip — already identical)
- Modify: `components/ui/dropdown-menu.tsx` (skip — already identical)
- Modify: `components/ui/avatar.tsx` (skip — already identical)
- Modify: `components/ui/sheet.tsx` (skip — already identical)
- Create: `hooks/use-mobile.ts` (skip — already identical)
- Create: `app/dashboard/page.tsx` (will be deleted in Task 2)
- Overwrite: `components/app-sidebar.tsx` (will be rewritten in Task 3)
- Overwrite: `components/nav-main.tsx` (will be rewritten in Task 4)
- Overwrite: `components/nav-projects.tsx` (will be deleted in Task 5)
- Overwrite: `components/nav-user.tsx` (will be rewritten in Task 6)
- Overwrite: `components/team-switcher.tsx` (will be deleted in Task 5)

- [ ] **Step 1: Install the sidebar-07 block**

```bash
npx shadcn@latest add sidebar-07
```

Expected: 18 files processed, 5 overwritten, 12 skipped (identical).

- [ ] **Step 2: Verify installation succeeded**

```bash
ls components/team-switcher.tsx components/nav-projects.tsx app/dashboard/page.tsx
```

Expected: All 3 files exist (will be cleaned up in subsequent tasks).

---

### Task 2: Delete demo page and unused files

**Files:**

- Delete: `app/dashboard/page.tsx`
- Delete: `components/team-switcher.tsx`
- Delete: `components/nav-projects.tsx`

- [ ] **Step 1: Delete demo page**

```bash
rm app/dashboard/page.tsx
```

- [ ] **Step 2: Delete team-switcher**

```bash
rm components/team-switcher.tsx
```

- [ ] **Step 3: Delete nav-projects**

```bash
rm components/nav-projects.tsx
```

- [ ] **Step 4: Verify deleted files**

```bash
ls app/dashboard/page.tsx components/team-switcher.tsx components/nav-projects.tsx 2>&1
```

Expected: All return "No such file or directory".

- [ ] **Step 5: Commit cleanup**

```bash
git add -A && git commit -m "chore: remove sidebar-07 demo page and unused files"
```

---

### Task 3: Rewrite app-sidebar.tsx with TGAW navigation

**Files:**

- Modify: `components/app-sidebar.tsx`

**Interfaces:**

- Consumes: `role` prop from `app/(dashboard)/layout.tsx`
- Produces: `<AppSidebar>` component with `collapsible="icon"`

- [ ] **Step 1: Rewrite app-sidebar.tsx**

Replace the entire contents of `components/app-sidebar.tsx` with:

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen02Icon,
  Church01Icon,
  Home01Icon,
  Message02Icon,
  PenTool01Icon,
  Settings05Icon,
  Shield01Icon,
  Users01Icon,
  Calendar03Icon,
  Notification03Icon,
  CreditCard01Icon,
  LayoutDashboard01Icon,
} from "@hugeicons/core-free-icons"

const navItems = [
  {
    title: "Overview",
    url: "/",
    icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={1.8} />,
  },
  {
    title: "Devotion",
    icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={1.8} />,
    items: [
      { title: "Calendar", url: "/calendar" },
      { title: "Bible Reading", url: "/bible" },
      { title: "Prayer", url: "/prayer" },
      { title: "Praise & Worship", url: "/worship" },
      { title: "Book a Slot", url: "/booking" },
    ],
  },
  {
    title: "Community",
    icon: <HugeiconsIcon icon={Users01Icon} strokeWidth={1.8} />,
    items: [
      { title: "Feed", url: "/feed" },
      { title: "Messages", url: "/messages" },
      { title: "Groups", url: "/groups" },
    ],
  },
  {
    title: "Account",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={1.8} />,
    items: [
      { title: "Settings", url: "/settings" },
      { title: "Notifications", url: "/notifications" },
    ],
  },
]

const adminItems = [
  {
    title: "Admin",
    icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={1.8} />,
    items: [
      { title: "Admin Portal", url: "/admin" },
      { title: "Moderation Queue", url: "/admin/reports" },
      { title: "User Management", url: "/admin/users" },
    ],
  },
]

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role: string }) {
  const isAdmin = ["moderator", "admin"].includes(role)
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-lg font-bold">
            TGA<span className="text-red-500">W</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={allItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

- [ ] **Step 2: Verify no import errors**

```bash
bun run check 2>&1 | head -20
```

Expected: No errors related to `app-sidebar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx && git commit -m "feat: rewrite app-sidebar with collapsible icon sidebar"
```

---

### Task 4: Rewrite nav-main.tsx

**Files:**

- Modify: `components/nav-main.tsx`

**Interfaces:**

- Consumes: `items` array from `AppSidebar` (each item has `title`, `icon`, optional `items` sub-array)
- Produces: `NavMain` component rendering collapsible nav groups

- [ ] **Step 1: Rewrite nav-main.tsx**

Replace the entire contents of `components/nav-main.tsx` with:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive ?? true}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={item.title} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton
                          render={
                            <Link
                              href={subItem.url}
                              className="cursor-pointer"
                            />
                          }
                          isActive={pathname === subItem.url}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                render={<Link href={item.url!} className="cursor-pointer" />}
                isActive={pathname === item.url}
                tooltip={item.title}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
```

- [ ] **Step 2: Verify no import errors**

```bash
bun run check 2>&1 | head -20
```

Expected: No errors related to `nav-main.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/nav-main.tsx && git commit -m "feat: rewrite nav-main with TGAW nav items and hugeicons"
```

---

### Task 5: Rewrite nav-user.tsx

**Files:**

- Modify: `components/nav-user.tsx`

**Interfaces:**

- Consumes: session from `useSession()` (Better Auth client)
- Produces: `NavUser` component with avatar, name, role, and dropdown menu

- [ ] **Step 1: Rewrite nav-user.tsx**

Replace the entire contents of `components/nav-user.tsx` with:

```tsx
"use client"

import { useSession, signOut } from "@/lib/auth-client"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon, User02Icon } from "@hugeicons/core-free-icons"

export function NavUser() {
  const { data: session } = useSession()
  const user = session?.user

  if (!user) return null

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton className="cursor-pointer" />}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.role || "member"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <HugeiconsIcon
                icon={User02Icon}
                strokeWidth={1.8}
                className="mr-2 size-4"
              />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => signOut()}
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                strokeWidth={1.8}
                className="mr-2 size-4"
              />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

- [ ] **Step 2: Verify no import errors**

```bash
bun run check 2>&1 | head -20
```

Expected: No errors related to `nav-user.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/nav-user.tsx && git commit -m "feat: rewrite nav-user with hugeicons"
```

---

### Task 6: Verify build and integration

**Files:** None (verification only)

- [ ] **Step 1: Run lint and format check**

```bash
bun run check
```

Expected: Pass with no errors.

- [ ] **Step 2: Run build**

```bash
bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run tests (if any)**

```bash
bun run test 2>&1 | tail -5
```

Expected: All tests pass or no tests found.

- [ ] **Step 4: Manual verification checklist**

- Sidebar collapses to icons when toggled
- Sidebar expands to show full labels
- All nav links navigate correctly
- RBAC: admin items hidden for `member` role
- RBAC: admin items visible for `admin`/`moderator` role
- Mobile: sidebar becomes sheet overlay
- SidebarTrigger in topbar toggles sidebar
- User avatar and name shown in footer
- Sign out works from dropdown menu

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix: sidebar-07 integration adjustments"
```

(Skip if no fixes were needed.)
