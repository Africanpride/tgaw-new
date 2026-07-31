"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  BookOpen,
  Calendar,
  Church,
  ChevronDown,
  Home,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Users,
  Settings,
  Bell,
  PenSquare,
  CreditCard,
} from "lucide-react"

const navItems = [
  { title: "Overview", url: "/", icon: Home },
  {
    title: "Devotion",
    icon: BookOpen,
    children: [
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Bible Reading", url: "/bible", icon: BookOpen },
      { title: "Prayer", url: "/prayer", icon: Church },
      { title: "Praise & Worship", url: "/worship", icon: Church },
      { title: "Book a Slot", url: "/booking", icon: CreditCard },
    ],
  },
  {
    title: "Community",
    icon: Users,
    children: [
      { title: "Feed", url: "/feed", icon: PenSquare },
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Groups", url: "/groups", icon: Users },
    ],
  },
  {
    title: "Account",
    icon: Settings,
    children: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
]

const adminItems = [
  {
    title: "Admin",
    icon: Shield,
    children: [
      { title: "Admin Portal", url: "/admin", icon: LayoutDashboard },
      { title: "Moderation Queue", url: "/admin/reports", icon: Shield },
      { title: "User Management", url: "/admin/users", icon: Users },
    ],
  },
]

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = ["moderator", "admin"].includes(role)
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-lg font-bold">
            TGA<span className="text-red-500">W</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {allItems.map((item) =>
            item.children ? (
              <Collapsible key={item.title} defaultOpen>
                <SidebarMenuItem>
                  <CollapsibleTrigger render={<SidebarMenuButton />}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.url}>
                          <SidebarMenuSubButton
                            render={<Link href={child.url} className="cursor-pointer" />}
                            isActive={pathname === child.url}
                          >
                              <child.icon className="size-4" />
                              <span>{child.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
                <SidebarMenuItem key={item.url}>
                <SidebarMenuButton render={<Link href={item.url!} className="cursor-pointer" />} isActive={pathname === item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
