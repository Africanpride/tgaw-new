"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck,
  Home,
  MessageSquare,
  PenSquare,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  dockItems,
  formatDockBadge,
  getDockInitials,
  isDockPathActive,
} from "@/lib/mobileDock"

type DockIconName = (typeof dockItems)[number]["icon"]

const icons: Record<DockIconName, LucideIcon> = {
  home: Home,
  pen: PenSquare,
  calendar: CalendarCheck,
  messages: MessageSquare,
  profile: UserRound,
}

interface DockCounts {
  todayBookings: number
  unreadMessages: number
}

function DockBadge({
  count,
  label,
}: {
  count: number | null | undefined
  label: string
}) {
  const value = formatDockBadge(count)
  if (!value) return null

  return (
    <>
      <span
        className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-card"
        aria-hidden="true"
      >
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

export function MobileDock() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const reduceMotion = useReducedMotion()
  const [counts, setCounts] = useState<DockCounts | null>(null)
  const user = session?.user
  const userName = user?.name ?? null
  const userImage = user?.image ?? null

  useEffect(() => {
    let active = true

    async function loadCounts() {
      try {
        const response = await fetch("/api/v1/mobile-dock", {
          cache: "no-store",
        })
        if (!response.ok) return
        const result = (await response.json()) as {
          success: boolean
          data?: DockCounts
        }
        if (active && result.success && result.data) setCounts(result.data)
      } catch {}
    }

    void loadCounts()
    const timer = window.setInterval(loadCounts, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="grid min-h-[56px] grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        {dockItems.map((item) => {
          const isActive = isDockPathActive(pathname, item.href)
          const Icon = icons[item.icon]

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="relative inline-flex size-5 items-center justify-center">
                {item.icon === "profile" ? (
                  userImage ? (
                    <Image
                      src={userImage}
                      alt={userName ?? "Profile"}
                      width={20}
                      height={20}
                      unoptimized
                      className={cn(
                        "rounded-full object-cover",
                        isActive && "ring-2 ring-foreground",
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {getDockInitials(userName)}
                    </span>
                  )
                ) : (
                  <Icon
                    aria-hidden="true"
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                )}
                {item.href === "/booking" && (
                  <DockBadge
                    count={counts?.todayBookings ?? null}
                    label={`${counts?.todayBookings ?? 0} active bookings`}
                  />
                )}
                {item.href === "/messages" && (
                  <DockBadge
                    count={counts?.unreadMessages ?? null}
                    label={`${counts?.unreadMessages ?? 0} unread messages`}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              {isActive &&
                (reduceMotion ? (
                  <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-foreground" />
                ) : (
                  <motion.span
                    layoutId="mobile-dock-active-pill"
                    className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                ))}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
