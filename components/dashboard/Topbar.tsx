"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import Link from "next/link"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/calendar": "Calendar",
  "/bible": "Bible Reading",
  "/prayer": "Prayer",
  "/worship": "Praise & Worship",
  "/booking": "Slot Booking",
  "/feed": "Community Feed",
  "/messages": "Messages",
  "/groups": "Groups",
  "/settings": "Settings",
  "/notifications": "Notifications",
  "/admin": "Admin Portal",
  "/admin/reports": "Moderation Queue",
  "/admin/users": "User Management",
}

export function Topbar() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="cursor-pointer lg:hidden" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/notifications" className="cursor-pointer" />}>
            <Bell className="size-5" />
        </Button>
      </div>
    </header>
  )
}
