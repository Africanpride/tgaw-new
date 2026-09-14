"use client"

import * as React from "react"
import Link from "next/link"
import {
  Book,
  Church,
  Music,
  Clock,
  VideoOff as VideoOffIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IconTile } from "@/components/IconTile"
import { convertUtcTimeToLocal, isCurrentSlot } from "./slotTime"
import { slotAccent } from "./slotAccent"

type BookableType = "BIBLE" | "PRAYER" | "PRAISE_WORSHIP"

interface Slot {
  id: string
  type: BookableType
  date: string
  startTime: string
  endTime: string
  bookedBy?: string | null
  bookedByName: string | null
  bookedByImage: string | null
  isBooked: boolean
  isOwnBooking?: boolean
  event: { title: string } | null
  eventId?: string | null
}

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0]
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split("T")[0]
}

function getLiveWindow(slots: Slot[], upcoming: number): Slot[] {
  const total = Math.max(1, Math.min(11, upcoming + 1))
  if (slots.length === 0) return []
  const currentIdx = slots.findIndex((s) =>
    isCurrentSlot(s as { date: string; startTime: string; endTime: string })
  )
  if (currentIdx !== -1) {
    return slots.slice(currentIdx, currentIdx + total)
  }
  const now = new Date()
  const nowMs = now.getTime()
  let nextIdx = slots.findIndex(
    (s) => new Date(`${s.date}T${s.startTime}:00Z`).getTime() > nowMs
  )
  if (nextIdx === -1) nextIdx = 0
  return slots.slice(nextIdx, nextIdx + total)
}

const channelMeta: Record<
  BookableType,
  {
    label: string
    href: string
    icon: typeof Book
    accent: (typeof slotAccent)[keyof typeof slotAccent]
  }
> = {
  BIBLE: {
    label: "Bible Reading",
    href: "/bible",
    icon: Book,
    accent: slotAccent.BIBLE,
  },
  PRAYER: {
    label: "Prayer",
    href: "/prayer",
    icon: Church,
    accent: slotAccent.PRAYER,
  },
  PRAISE_WORSHIP: {
    label: "Praise & Worship",
    href: "/worship",
    icon: Music,
    accent: slotAccent.PRAISE_WORSHIP,
  },
}

function SlotCard({ slot, isLive }: { slot: Slot; isLive: boolean }) {
  const meta = channelMeta[slot.type]
  const Icon = meta.icon
  const timeLocal = `${convertUtcTimeToLocal(slot.startTime)} – ${convertUtcTimeToLocal(slot.endTime)}`

  let line2: string
  let avatarName: string | null = null
  let avatarUrl: string | null = null
  let isBlocked = !!slot.eventId

  if (isBlocked) {
    line2 = slot.event
      ? `Blocked — ${slot.event.title}`
      : "Blocked — Special Event"
  } else if (slot.isBooked) {
    line2 = slot.bookedByName ?? "Member"
    avatarName = slot.bookedByName ?? "M"
    avatarUrl = slot.bookedByImage ?? null
  } else {
    line2 = "Available"
  }

  const anchorHref = `${meta.href}?date=${slot.date}`

  const pingColors: Record<BookableType, { ping: string; dot: string }> = {
    BIBLE: { ping: "bg-purple-400", dot: "bg-purple-500" },
    PRAYER: { ping: "bg-red-400", dot: "bg-red-500" },
    PRAISE_WORSHIP: { ping: "bg-amber-400", dot: "bg-amber-500" },
  }
  const ping = isBlocked ? { ping: "bg-violet-400", dot: "bg-violet-500" } : pingColors[slot.type]

  return (
    <Card className="relative @container border py-0 shadow-none transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-muted/50">
      <CardContent className="flex items-center space-x-4 p-4">
        <span className="relative inline-flex shrink-0">
          <Avatar
            className={`h-10 w-10 shrink-0 ${!slot.isBooked && !isBlocked ? `border ${meta.accent.iconTile.replace("bg-", "bg-")}` : ""}`}
          >
            {avatarUrl ? (
              <AvatarImage
                alt={avatarName ?? line2}
                src={avatarUrl}
                referrerPolicy="no-referrer"
              />
            ) : slot.isBooked || isBlocked ? (
              <AvatarFallback>
                {(avatarName ?? line2).charAt(0).toUpperCase()}
              </AvatarFallback>
            ) : (
              <AvatarFallback className={meta.accent.iconTile}>
                <Icon className="size-4" aria-hidden="true" />
              </AvatarFallback>
            )}
          </Avatar>
          {isLive && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3" aria-hidden="true">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${ping.ping}`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${ping.dot}`} />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={anchorHref} className="focus:outline-none">
            <span aria-hidden="true" className="absolute inset-0" />
            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
              <span className="truncate text-[clamp(12px,3.5cqi,0.875rem)]">{timeLocal}</span>
              {isLive && (
                <Badge
                  variant="default"
                  className="h-[clamp(16px,4cqi,20px)] shrink-0 px-1.5 text-[clamp(9px,2.2cqi,10px)] leading-none text-white bg-emerald-600 dark:bg-emerald-500"
                >
                  LIVE
                </Badge>
              )}
              {slot.isOwnBooking && (
                <Badge variant="outline" className="h-[clamp(16px,4cqi,20px)] shrink-0 text-[clamp(9px,2.2cqi,10px)]">
                  You
                </Badge>
              )}
              {isBlocked && (
                <Badge
                  variant="secondary"
                  className="h-[clamp(16px,4cqi,20px)] shrink-0 bg-violet-500/15 text-[clamp(9px,2.2cqi,10px)] text-violet-700 dark:text-violet-300"
                >
                  Blocked
                </Badge>
              )}
            </p>
            <p className="text-pretty text-muted-foreground text-[clamp(11px,3.2cqi,0.875rem)] leading-tight [text-wrap:balance] line-clamp-2 min-w-0">
              {line2}
            </p>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelSection({
  type,
  slots,
  liveIds,
}: {
  type: BookableType
  slots: Slot[]
  liveIds: Set<string>
}) {
  const meta = channelMeta[type]
  const Icon = meta.icon
  const dateBadge = slots[0]?.date
    ? (() => {
        const d = new Date(`${slots[0].date}T00:00:00Z`)
        const today = toDateKey(new Date())
        if (slots[0].date === today) return "Today"
        const tomorrow = addDays(today, 1)
        if (slots[0].date === tomorrow) return "Tomorrow"
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      })()
    : ""

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <IconTile icon={Icon} size="xs" tone={meta.accent.iconTile} className="border" />
        <h3 className="text-xs font-semibold tracking-tight">{meta.label}</h3>
        <Badge variant="outline" className="ml-1 text-[10px] font-normal">
          {dateBadge}
        </Badge>
        <Link
          href={meta.href}
          className="ml-auto cursor-pointer text-[10px] text-muted-foreground underline-offset-4 hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {slots.map((s) => (
          <SlotCard key={s.id} slot={s} isLive={liveIds.has(s.id)} />
        ))}
      </div>
    </div>
  )
}

export function OverviewLiveGrid({ upcoming = 2 }: { upcoming?: number }) {
  const [data, setData] = React.useState<Record<BookableType, Slot[]> | null>(
    null
  )
  const [liveIds, setLiveIds] = React.useState<Set<string>>(new Set())
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const fetchLive = React.useCallback(async () => {
    const today = toDateKey(new Date())
    const tomorrow = addDays(today, 1)
    const types: BookableType[] = ["BIBLE", "PRAYER", "PRAISE_WORSHIP"]
    const all: Record<BookableType, Slot[]> = {
      BIBLE: [],
      PRAYER: [],
      PRAISE_WORSHIP: [],
    }

    await Promise.all(
      types.map(async (type) => {
        const [todayRes, tomorrowRes] = await Promise.all([
          fetch(`/api/v1/slots?date=${today}&type=${type}`)
            .then((r) => r.json())
            .catch(() => null),
          fetch(`/api/v1/slots?date=${tomorrow}&type=${type}`)
            .then((r) => r.json())
            .catch(() => null),
        ])
        const todaySlots: Slot[] = todayRes?.success
          ? (todayRes.data.slots as Slot[])
          : []
        const tomorrowSlots: Slot[] = tomorrowRes?.success
          ? (tomorrowRes.data.slots as Slot[])
          : []
        const combined = [...todaySlots, ...tomorrowSlots].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.startTime.localeCompare(b.startTime)
        })
        all[type] = getLiveWindow(combined, upcoming)
      })
    )
    setData(all)
    const allSlots = Object.values(all).flat()
    const lives = new Set(
      allSlots.filter((s) => isCurrentSlot(s as never)).map((s) => s.id)
    )
    setLiveIds(lives)
  }, [upcoming])

  React.useEffect(() => {
    fetchLive()
  }, [fetchLive, tick])

  React.useEffect(() => {
    if (!data) return
    const allSlots = Object.values(data).flat()
    setLiveIds(
      new Set(
        allSlots.filter((s) => isCurrentSlot(s as never)).map((s) => s.id)
      )
    )
  }, [tick, data])

  if (!data) {
    const skelCount = Math.max(1, Math.min(11, upcoming + 1))
    return (
      <Card className="border-[0.5px] border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4" /> Live Now & Up Next
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: skelCount }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const isEmpty = Object.values(data).every((arr) => arr.length === 0)

  if (isEmpty) {
    return (
      <Card className="border-[0.5px] border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4" />
            Live Now & Up Next
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <VideoOffIcon
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No slots available for today.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[0.5px] border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4" aria-hidden="true" />
          Live Now & Up Next
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live now and coming up next — all times in your local time.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {(["BIBLE", "PRAYER", "PRAISE_WORSHIP"] as BookableType[]).map(
          (type) => (
            <ChannelSection
              key={type}
              type={type}
              slots={data[type]}
              liveIds={liveIds}
            />
          )
        )}
      </CardContent>
    </Card>
  )
}