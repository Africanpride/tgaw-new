"use client"

import {
  Book,
  BookAIcon,
  BookOpen,
  Calendar,
  CalendarCheck,
  Church,
  CircleHelp,
  CircleQuestionMarkIcon,
  Home,
  MessageCircle,
  MessageSquare,
  Music,
  PenTool,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"
import Link from "next/link"
import type * as React from "react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navData = [
  {
    title: "Overview",
    url: "/overview",
    icon: <Home />,
  },
  {
    title: "Devotion",
    url: "#",
    icon: <BookOpen />,
    items: [
      {
        title: "Calendar",
        url: "/calendar",
        icon: <Calendar className="size-4" />,
      },
      {
        title: "Bible Reading",
        url: "/bible",
        icon: <Book className="size-4" />,
      },
      {
        title: "Prayer",
        url: "/prayer",
        icon: <Church className="size-4" />,
      },
      {
        title: "Praise & Worship",
        url: "/worship",
        icon: <Music className="size-4" />,
      },
      {
        title: "Slot Booking",
        url: "/booking",
        icon: <CalendarCheck className="size-4" />,
      },
    ],
  },
  {
    title: "Community",
    url: "#",
    icon: <MessageCircle />,
    items: [
      {
        title: "Feed",
        url: "/feed",
        icon: <PenTool className="size-4" />,
      },
      {
        title: "Messages",
        url: "/messages",
        icon: <MessageSquare className="size-4" />,
      },
      {
        title: "Groups",
        url: "/groups",
        icon: <Users className="size-4" />,
      },
    ],
  },
]

const adminItems = [
  {
    title: "Admin",
    url: "#",
    icon: <Shield />,
    items: [
      {
        title: "Admin Portal",
        url: "/admin",
        icon: <Shield className="size-4" />,
      },
      {
        title: "User Management",
        url: "/admin/users",
        icon: <UserCog className="size-4" />,
      },
    ],
  },
]

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: string }) {
  const userRole = role || "member"
  const isSuperadmin = userRole === "superadmin"
  const isLeader = userRole === "leader" || isSuperadmin
  const isCoordinator = userRole === "coordinator" || isSuperadmin
  const isBoard = userRole === "board" || isSuperadmin

  const roleNavItems = []

  if (isCoordinator) {
    roleNavItems.push({
      title: "Coordinator",
      url: "#",
      icon: <Users />,
      items: [
        {
          title: "Timezone Dashboard",
          url: "/coordinator",
          icon: <Users className="size-4" />,
        },
      ],
    })
  }

  if (isBoard) {
    roleNavItems.push({
      title: "Board",
      url: "#",
      icon: <Shield />,
      items: [
        {
          title: "Org Dashboard",
          url: "/board",
          icon: <Shield className="size-4" />,
        },
      ],
    })
  }

  if (isLeader) {
    const adminSubItems = [
      {
        title: "Admin Portal",
        url: "/admin",
        icon: <Shield className="size-4" />,
      },
    ]
    if (isSuperadmin) {
      adminSubItems.push({
        title: "User Management",
        url: "/admin/users",
        icon: <UserCog className="size-4" />,
      })
    }
    roleNavItems.push({
      title: "Admin",
      url: "#",
      icon: <Shield />,
      items: adminSubItems,
    })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <ShieldCheck className="size-6" />
          <span className="truncate text-lg font-semibold group-data-[collapsible=icon]:hidden">
            TGAW
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...navData, ...roleNavItems]} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  href="https://tgaw.app/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                />
              }
              tooltip="Help"
            >
              <CircleQuestionMarkIcon />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  href="https://tgaw.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                />
              }
              tooltip="Documentation"
            >
              <BookAIcon />
              <span>Documentation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
