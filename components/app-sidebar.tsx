"use client"

import {
  Book,
  BookAIcon,
  Calendar,
  CalendarCheck,
  Church,
  CircleQuestionMarkIcon,
  Gavel,
  Home,
  MessageCircle,
  MessageSquare,
  Music,
  PenTool,
  ScrollText,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"
import Link from "next/link"
import type * as React from "react"
import { useTranslation } from "react-i18next"
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
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: string }) {
  const { t } = useTranslation("dashboard")
  const userRole = role || "member"
  const isSuperadmin = userRole === "superadmin"
  const isLeader = userRole === "leader" || isSuperadmin
  const isCoordinator = userRole === "coordinator" || isSuperadmin
  const isBoard = userRole === "board" || isSuperadmin

  const { setOpen, isMobile } = useSidebar()

  const navData = [
    {
      title: t("sidebar.overview"),
      url: "/overview",
      icon: <Home />,
    },
    {
      title: t("sidebar.calendar"),
      url: "/calendar",
      icon: <Calendar />,
    },
    {
      title: t("sidebar.bible"),
      url: "/bible",
      icon: <Book />,
    },
    {
      title: t("sidebar.prayer"),
      url: "/prayer",
      icon: <Church />,
    },
    {
      title: t("sidebar.worship"),
      url: "/worship",
      icon: <Music />,
    },
    {
      title: t("sidebar.booking"),
      url: "/booking",
      icon: <CalendarCheck />,
    },
    {
      title: t("sidebar.community"),
      url: "#",
      icon: <MessageCircle />,
      items: [
        {
          title: t("sidebar.feed"),
          url: "/feed",
          icon: <PenTool className="size-4" />,
        },
        {
          title: t("sidebar.messages"),
          url: "/messages",
          icon: <MessageSquare className="size-4" />,
        },
        {
          title: t("sidebar.groups"),
          url: "/groups",
          icon: <Users className="size-4" />,
        },
      ],
    },
  ]

  const roleNavItems: {
    title: string
    url: string
    icon: React.ReactNode
    items: { title: string; url: string; icon: React.ReactNode }[]
  }[] = []

  if (isCoordinator) {
    roleNavItems.push({
      title: t("sidebar.coordinator"),
      url: "#",
      icon: <Users />,
      items: [
        {
          title: t("sidebar.coordinatorDashboard"),
          url: "/coordinator",
          icon: <Users className="size-4" />,
        },
      ],
    })
  }

  if (isBoard) {
    roleNavItems.push({
      title: t("sidebar.board"),
      url: "#",
      icon: <Gavel />,
      items: [
        {
          title: t("sidebar.orgDashboard"),
          url: "/board",
          icon: <Gavel className="size-4" />,
        },
      ],
    })
  }

  if (isLeader) {
    const adminSubItems = [
      {
        title: t("sidebar.admin"),
        url: "/admin",
        icon: <Shield className="size-4" />,
      },
      {
        title: t("sidebar.activityLogs"),
        url: "/admin/activity-logs",
        icon: <ScrollText className="size-4" />,
      },
    ]
    if (isSuperadmin) {
      adminSubItems.push({
        title: t("sidebar.users"),
        url: "/admin/users",
        icon: <UserCog className="size-4" />,
      })
    }
    roleNavItems.push({
      title: t("sidebar.adminSection"),
      url: "#",
      icon: <Shield />,
      items: adminSubItems,
    })
  }

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={() => {
        if (!isMobile) setOpen(true)
      }}
      onMouseLeave={() => {
        if (!isMobile) setOpen(false)
      }}
      {...props}
    >
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
              tooltip={t("sidebar.helpTooltip")}
            >
              <CircleQuestionMarkIcon />
              <span>{t("sidebar.help")}</span>
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
              tooltip={t("sidebar.documentation")}
            >
              <BookAIcon />
              <span>{t("sidebar.documentation")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}