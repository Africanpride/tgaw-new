import { BookOpen, CalendarDays, Clock, Flame, Heart } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { EventType } from "@prisma/client"
import { StatCard } from "@/components/dashboard/StatCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { CommunityActivity } from "@/components/dashboard/CommunityActivity"
import {
  AgendaView,
  type AgendaDay,
  type AgendaEvent,
  type AgendaSummary,
} from "@/components/booking/AgendaView"
import { VerseCard } from "@/components/verse/VerseCard"
import { MeetingBanner, type SpecialEventMeeting } from "@/components/meetings/MeetingBanner"
import {
  getActiveSlotHosts,
  getBookingConfig,
  getUserSlotStats,
} from "@/lib/services/slotService"
import { formatMinutes } from "@/lib/services/slotStats"
import { eventEndTime } from "@/lib/services/eventBlockService"

const WINDOW_MIN = 16 * 60

function slotTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BIBLE: "Bible Reading",
    PRAYER: "Prayer",
    PRAISE_WORSHIP: "Praise & Worship",
  }
  return labels[type] ?? type
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

/** Build a Date from a YYYY-MM-DD + HH:MM pair in UTC (handles "24:00" rollover). */
function utcDateTime(date: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCMinutes(d.getUTCMinutes() + h * 60 + m)
  return d
}

function deriveInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface SlotBlock {
  id: string
  type: EventType
  startTime: string
  endTime: string
  notes: string | null
}

function mergeBlocks(slots: SlotBlock[]): SlotBlock[] {
  const sorted = [...slots].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  )
  const blocks: SlotBlock[] = []
  for (const slot of sorted) {
    const last = blocks[blocks.length - 1]
    if (
      last &&
      last.type === slot.type &&
      toMinutes(slot.startTime) === toMinutes(last.endTime)
    ) {
      last.endTime = slot.endTime
      last.notes = last.notes ?? slot.notes
    } else {
      blocks.push({ ...slot })
    }
  }
  return blocks
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split("T")[0]
}

export default async function OverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const user = session.user
  const today = new Date().toISOString().split("T")[0]
  const tomorrow = addDays(today, 1)

  const mySlots = (
    await prisma.slot.findMany({
      where: {
        bookedBy: user.id!,
        date: { gte: today },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })
  ).map((slot) => ({
    id: slot.id,
    type: slot.type,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    notes: slot.notes,
  }))

  const todaySlots = mySlots.filter((slot) => slot.date === today)
  const nextDate =
    [...new Set(mySlots.map((slot) => slot.date))]
      .filter((date) => date > today)
      .sort()[0] ?? null
  const nextSlots = nextDate ? mySlots.filter((slot) => slot.date === nextDate) : []

  const todayBlocks = mergeBlocks(todaySlots)
  const nextBlocks = nextDate ? mergeBlocks(nextSlots) : []

  const linkDates = [...new Set([today, nextDate].filter((d): d is string => !!d))]
  const links = await prisma.meetingLink.findMany({
    where: {
      OR: [{ date: { in: linkDates } }, { date: "DEFAULT" }],
    },
  })
  const leaderIds = [...new Set(links.map((link) => link.createdBy))]
  const leaders = leaderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: leaderIds } },
        select: { id: true, name: true, initials: true },
      })
    : []

  const activeHosts = await getActiveSlotHosts()
  const [stats, bookingConfig] = await Promise.all([
    user.id ? getUserSlotStats(user.id) : Promise.resolve(null),
    getBookingConfig(),
  ])

  // Upcoming / in-progress org-wide Special Events for the meeting banner.
  const now = new Date()
  const specialCandidates = (
    await prisma.event.findMany({
      where: { type: "SPECIAL", date: { gte: today } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 10,
    })
  )
    .map((event) => ({ event, endTime: eventEndTime(event.time, event.duration) }))
    .filter(({ event, endTime }) => utcDateTime(event.date, endTime) > now)
    .slice(0, 3)

  const specialHostIds = [...new Set(specialCandidates.map(({ event }) => event.userId))]
  const specialHostUsers = specialHostIds.length
    ? await prisma.user.findMany({
        where: { id: { in: specialHostIds } },
        select: { id: true, name: true },
      })
    : []
  const specialHostNameMap = new Map(specialHostUsers.map((u) => [u.id, u.name]))

  const specialEvents: SpecialEventMeeting[] = specialCandidates.map(
    ({ event, endTime }) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: event.time,
      endTime,
      zoomUrl: event.zoomUrl,
      hostName: specialHostNameMap.get(event.userId) ?? null,
      isLive:
        now >= utcDateTime(event.date, event.time) &&
        now < utcDateTime(event.date, endTime),
    })
  )

  const buildEvents = (date: string, blocks: SlotBlock[]): AgendaEvent[] =>
    blocks.map((block) => {
      const link =
        links.find((l) => l.type === block.type && l.date === date) ??
        links.find((l) => l.type === block.type && l.date === "DEFAULT") ??
        null
      const leader = link ? leaders.find((u) => u.id === link.createdBy) : undefined
      return {
        id: block.id,
        type: block.type,
        title: slotTypeLabel(block.type),
        note: block.notes,
        startTime: block.startTime,
        endTime: block.endTime,
        hasLink: !!link,
        locationText: link ? `Zoom · ${link.label ?? "Meeting"}` : null,
        leaderInitials: leader
          ? leader.initials ?? deriveInitials(leader.name ?? undefined)
          : null,
        leaderName: leader?.name ?? null,
      }
    })

  const days: AgendaDay[] = []
  if (todayBlocks.length > 0) {
    days.push({
      key: "today",
      label: "Today",
      dateLabel: formatDateLabel(today),
      events: buildEvents(today, todayBlocks),
    })
  }
  if (nextBlocks.length > 0 && nextDate) {
    days.push({
      key: "next",
      label: nextDate === tomorrow ? "Tomorrow" : formatDateLabel(nextDate),
      dateLabel: formatDateLabel(nextDate),
      events: buildEvents(nextDate, nextBlocks),
    })
  }

  const eventCount = days.reduce((n, day) => n + day.events.length, 0)
  const bookedMin = days.reduce(
    (n, day) =>
      n +
      day.events.reduce(
        (m, evt) => m + (toMinutes(evt.endTime) - toMinutes(evt.startTime)),
        0
      ),
    0
  )
  const focusMin = Math.max(0, days.length * WINDOW_MIN - bookedMin)
  const summary: AgendaSummary = { eventCount, bookedMin, focusMin }

  const sessionCount = todaySlots.length

  const hour = new Date().getHours()
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : hour >= 17 && hour < 22
          ? "Good evening"
          : "Good night"

  const firstName = user.name?.split(" ")[0] || "there"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {sessionCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              &middot;{" "}
              <Badge variant="secondary" className="text-xs">
                {sessionCount} session{sessionCount !== 1 ? "s" : ""} today
              </Badge>
            </span>
          )}
        </p>
      </div>
      <VerseCard />
      <MeetingBanner initialHosts={activeHosts} initialSpecialEvents={specialEvents} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sessions Today"
          value={sessionCount}
          description={sessionCount > 0 ? "On today's watch" : "Nothing booked yet"}
          icon={CalendarDays}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Sessions This Week"
          value={stats?.weekSessions ?? 0}
          description="Keep the rhythm going!"
          icon={Flame}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Prayer Sessions"
          value={stats?.monthByType["PRAYER"] ?? 0}
          description="This month"
          icon={Heart}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Total Time"
          value={formatMinutes(stats?.monthMinutes ?? 0)}
          description="Devotion this month"
          icon={Clock}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AgendaView days={days} summary={summary} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Weekly Watch Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(
              [
                { type: "BIBLE", cap: bookingConfig.maxBibleSlotsPerDay, bar: "bg-purple-500" },
                { type: "PRAYER", cap: bookingConfig.maxPrayerSlotsPerDay, bar: "bg-red-500" },
                {
                  type: "PRAISE_WORSHIP",
                  cap: bookingConfig.maxWorshipSlotsPerDay,
                  bar: "bg-amber-500",
                },
              ] as const
            ).map(({ type, cap, bar }) => {
              const capacity = cap * 7
              const booked = stats?.weekByType[type] ?? 0
              const percent = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{slotTypeLabel(type)}</span>
                    <span className="text-muted-foreground">
                      {booked}/{capacity} &middot; {percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${bar} transition-[width] duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <div className="lg:col-span-1">
          <CommunityActivity />
        </div>
      </div>

      {/* <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <UpcomingBookings bookings={upcomingBookings} />
        </div>
      </div> */}
    </div>
  )
}