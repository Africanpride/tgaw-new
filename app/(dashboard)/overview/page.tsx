import { BookOpen, Clock, Flame, Timer } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { EventType } from "@prisma/client"
import { StatCard } from "@/components/dashboard/StatCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { UpcomingBookings } from "@/components/booking/UpcomingBookings"
import { CommunityActivity } from "@/components/dashboard/CommunityActivity"
import {
  AgendaView,
  type AgendaDay,
  type AgendaEvent,
  type AgendaSummary,
} from "@/components/booking/AgendaView"

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

  const upcomingBookings = mySlots.map((slot) => ({
    id: slot.id,
    event: {
      type: slot.type,
      title: slotTypeLabel(slot.type),
      date: slot.date,
      time: slot.startTime,
      duration: 30,
    },
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Day Streak"
          value={0}
          description="Keep it going!"
          icon={Flame}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Chapters Read"
          value="—"
          description="This month"
          icon={BookOpen}
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          title="Prayer Sessions"
          value="—"
          description="This month"
          icon={Timer}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Total Time"
          value="—"
          description="Hours invested"
          icon={Clock}
          className="border-l-4 border-l-blue-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AgendaView days={days} summary={summary} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Bible Reading Plan</span>
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Prayer Goal</span>
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
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