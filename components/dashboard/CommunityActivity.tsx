"use client"

import { Activity, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatedList } from "@/components/shadcn-space/animated-list/animated-list-01"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import { listRowClass } from "@/components/list-row"
import { cn } from "@/lib/utils"

type ActivityItem = {
  id: string
  type: string
  category: "praise" | "prayer" | "member" | "all"
  title: string
  subtitle: string
  href: string
  initials: string
  name: string
  image?: string | null
  createdAt: string
}

function tintFor(category: ActivityItem["category"]): string {
  switch (category) {
    case "praise": return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    case "prayer": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    case "member": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    default: return "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
  }
}

const FILTERS = ["all", "praise", "prayer", "member"] as const
type Filter = typeof FILTERS[number]

export function CommunityActivity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [isLive, setIsLive] = useState(false)

  async function fetchActivity() {
    try {
      const res = await fetch("/api/v1/activity?limit=10")
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
        const latest = data.data[0] as ActivityItem | undefined
        if (latest) {
          const age = Date.now() - new Date(latest.createdAt).getTime()
          setIsLive(age < 5 * 60 * 1000)
        }
      }
    } catch {
      // keep previous
    }
  }

  useEffect(() => {
    fetchActivity()
    const id = setInterval(fetchActivity, 30000)
    return () => clearInterval(id)
  }, [])

  const filtered = items ? (filter === "all" ? items : items.filter((i) => i.category === filter)) : null

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" aria-hidden="true" />
          Community Activity
          {isLive && <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />Live</span>}
        </CardTitle>
        <div className="mt-3 flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors", filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items === null ? (
          <div className="flex flex-col gap-2 p-2 sm:p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border bg-background p-2 sm:p-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="relative h-96 w-full flex-col overflow-hidden p-2 sm:p-3">
            <AnimatedList delay={900}>
              {/* AnimatedList reveals progressively then reverses — feed it
                  oldest-first so the final order is newest on top. */}
              {[...filtered].reverse().map((item) => (
                <Link
                  href={item.href}
                  key={item.id}
                  className={cn(listRowClass, "flex w-full items-center gap-3 bg-background p-2 hover:bg-muted/50 sm:p-3")}
                >
                  <Avatar className="size-9 shrink-0">
                    {item.image ? <AvatarImage src={item.image} alt={item.name} referrerPolicy="no-referrer" /> : null}
                    <AvatarFallback className={cn("text-xs font-semibold", tintFor(item.category))}>
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" aria-hidden="true" />
                      {item.subtitle}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden shrink-0 text-[10px] capitalize sm:inline-flex">
                    {item.category}
                  </Badge>
                </Link>
              ))}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-background" />
          </div>
        ) : (
          <div className="p-2 sm:p-3">
            <EmptyState
              icon={Activity}
              title="Quiet watch"
              description={filter === "all" ? "No recent activity — be first to share a testimony or prayer." : `No ${filter} activity recently.`}
              className="py-2 sm:py-10"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}