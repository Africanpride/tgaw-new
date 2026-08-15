"use client"

import { Activity } from "lucide-react"
import { AnimatedList } from "@/components/shadcn-space/animated-list/animated-list-01"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ActivityItem {
  initials: string
  tint: string
  title: string
  subtitle: string
}

const ACTIVITY: ActivityItem[] = [
  {
    initials: "SR",
    tint: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    title: "Sarah posted a praise report",
    subtitle: "A healing testimony, just now",
  },
  {
    initials: "DK",
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    title: "David shared a testimony",
    subtitle: "2 minutes ago",
  },
  {
    initials: "AM",
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    title: "Morning prayer starts soon",
    subtitle: "Join the 6:00 AM slot",
  },
  {
    initials: "GS",
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    title: "Grace answered a prayer",
    subtitle: "Prayer request marked as answered",
  },
  {
    initials: "JB",
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    title: "New member joined",
    subtitle: "Welcome John to the community",
  },
]

export function CommunityActivity() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" aria-hidden="true" />
          Community Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-96 w-full flex-col overflow-hidden p-3">
          <AnimatedList delay={900}>
            {ACTIVITY.map((item) => (
              <div
                key={item.initials}
                className="flex w-full items-center gap-3 rounded-2xl border bg-background p-3"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback
                    className={cn("text-xs font-semibold", item.tint)}
                  >
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </AnimatedList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-background" />
        </div>
      </CardContent>
    </Card>
  )
}
