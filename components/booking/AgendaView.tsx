import type { BookableType } from "@/lib/services/slotService"
import { CalendarCheck2, Video } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { convertUtcTimeToLocal } from "./slotTime"

export interface AgendaEvent {
  id: string
  type: string
  title: string
  note?: string | null
  startTime: string
  endTime: string
  hasLink: boolean
  locationText?: string | null
  leaderInitials?: string | null
  leaderName?: string | null
}

export interface AgendaDay {
  key: string
  label: string
  dateLabel: string
  events: AgendaEvent[]
}

export interface AgendaSummary {
  eventCount: number
  bookedMin: number
  focusMin: number
}

interface AgendaViewProps {
  days: AgendaDay[]
  summary: AgendaSummary
}

const typeBar: Record<BookableType, string> = {
  BIBLE: "bg-purple-500",
  PRAYER: "bg-red-500",
  PRAISE_WORSHIP: "bg-amber-500",
}

function typeBarFor(type: string): string {
  return typeBar[type as BookableType] ?? "bg-violet-500"
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function Avatar({ initials, name }: { initials: string; name?: string }) {
  return (
    <span
      data-slot="avatar"
      title={name}
      className="inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-background align-middle font-medium text-xs size-6 border-2 border-background"
    >
      <span
        data-slot="avatar-fallback"
        className="flex size-full items-center justify-center rounded-full bg-muted text-[9px]"
      >
        {initials}
      </span>
    </span>
  )
}

export function AgendaView({ days, summary }: AgendaViewProps) {
  const hasEvents = summary.eventCount > 0
  const todayDay = days.find((d) => d.key === "today")
  const nextDay = days.find((d) => d.key === "next")
  const eyebrowDate = todayDay?.dateLabel ?? nextDay?.dateLabel

  const heading = !hasEvents
    ? "Your agenda"
    : todayDay && nextDay
      ? "Today and tomorrow"
      : nextDay
        ? nextDay.label
        : "Today"

  if (!hasEvents) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarCheck2 className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">No sessions booked yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Claim a devotional slot and keep your watch alive.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/booking" className="cursor-pointer">
              Book a Slot
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            {eyebrowDate} &middot; My Agenda
          </div>
          <h1 className="mt-1 font-heading text-3xl tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.eventCount} event{summary.eventCount === 1 ? "" : "s"} &middot;{" "}
            {formatDuration(summary.bookedMin)} booked &middot;{" "}
            {formatDuration(summary.focusMin)} focus time.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/booking" className="cursor-pointer">
            Book a Slot
          </Link>
        </Button>
      </div>

      {days.map((day) => (
        <section key={day.key} className="mt-8">
          <div className="mb-2 flex items-end justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              {day.label}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              {day.dateLabel}
            </span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {day.events.map((evt) => (
              <li
                key={evt.id}
                className="grid grid-cols-[80px_1fr] gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-3 transition-colors hover:bg-background/60"
              >
                <div className="font-mono text-[11px]">
                  <div className="text-foreground">{convertUtcTimeToLocal(evt.startTime)}</div>
                  <div className="text-muted-foreground">{convertUtcTimeToLocal(evt.endTime)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn("h-12 w-1 shrink-0 rounded-full", typeBarFor(evt.type))}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{evt.title}</div>
                    {evt.hasLink && evt.locationText && (
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <Video className="size-3" aria-hidden="true" />
                        <span>{evt.locationText}</span>
                      </div>
                    )}
                    {evt.note && (
                      <div className="mt-1 text-xs text-muted-foreground">{evt.note}</div>
                    )}
                  </div>
                  {evt.leaderInitials && (
                    <div className="flex items-center -space-x-1.5">
                      <Avatar initials={evt.leaderInitials} name={evt.leaderName ?? undefined} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}