"use client"

import * as React from "react"

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
  Home02Icon,
  BookOpen01Icon,
  Chat01Icon,
  Settings05Icon,
  Shield01Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"

const navData = [
  {
    title: "Overview",
    url: "/",
    icon: <HugeiconsIcon icon={Home02Icon} strokeWidth={2} />,
  },
  {
    title: "Devotion",
    url: "#",
    icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />,
    items: [
      { title: "Calendar", url: "/calendar" },
      { title: "Bible Reading", url: "/bible" },
      { title: "Prayer", url: "/prayer" },
      { title: "Praise & Worship", url: "/worship" },
    ],
  },
  {
    title: "Community",
    url: "#",
    icon: <HugeiconsIcon icon={Chat01Icon} strokeWidth={2} />,
    items: [
      { title: "Feed", url: "/feed" },
      { title: "Messages", url: "/messages" },
      { title: "Groups", url: "/groups" },
    ],
  },
  {
    title: "Account",
    url: "#",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    items: [{ title: "Settings", url: "/settings" }],
  },
]

const adminItems = [
  {
    title: "Admin",
    url: "#",
    icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />,
    items: [
      { title: "Admin Portal", url: "/admin", minRole: "moderator" },
      { title: "User Management", url: "/admin/users", minRole: "admin" },
    ],
  },
]

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: string }) {
  const filteredAdminItems =
    role && ["moderator", "admin"].includes(role) ? adminItems : []

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={2} className="size-6" />
          <span className="truncate text-lg font-semibold group-data-[collapsible=icon]:hidden">
            TGAW
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...navData, ...filteredAdminItems]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
