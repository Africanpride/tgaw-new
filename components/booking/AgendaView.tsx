import type { BookableType } from "@/lib/services/slotService"
import { CalendarCheck2, Video } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/EmptyState"
import { cn } from "@/lib/utils"
import { listRowClass } from "@/components/list-row"
import { eyebrowClass } from "@/components/eyebrow"
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
  locationUrl?: string | null
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
      className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background align-middle text-xs font-medium select-none"
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
      <EmptyState
        icon={CalendarCheck2}
        title="No sessions booked yet"
        description="Claim a devotional slot and keep your watch alive."
        actionLabel="Book a Slot"
        actionHref="/booking"
        className="h-full"
      />
    )
  }

  return (
    <div className="h-full rounded-xl border border-border/60 bg-background/40 p-2 sm:p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className={eyebrowClass}>
            {eyebrowDate} &middot; My Agenda
          </div>
          <h1 className="font-heading mt-1 text-3xl tracking-tight">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.eventCount} event{summary.eventCount === 1 ? "" : "s"}{" "}
            &middot; {formatDuration(summary.bookedMin)} booked &middot;{" "}
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
            <span className={eyebrowClass}>
              {day.label}
            </span>
            <span className={eyebrowClass}>
              {day.dateLabel}
            </span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {day.events.map((evt) => (
              <li
                key={evt.id}
                className={cn(
                  listRowClass,
                  "grid grid-cols-[80px_1fr] gap-2 border-border/60 bg-background/40 px-2 sm:px-3 py-3 hover:bg-background/60"
                )}
              >
                <div className="font-mono text-[11px]">
                  <div className="text-foreground">
                    {convertUtcTimeToLocal(evt.startTime)}
                  </div>
                  <div className="text-muted-foreground">
                    {convertUtcTimeToLocal(evt.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-12 w-1 shrink-0 rounded-full",
                      typeBarFor(evt.type)
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{evt.title}</div>
                    {evt.hasLink && evt.locationText && (
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        {evt.locationUrl ? (
                          <a
                            href={evt.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex cursor-pointer items-center gap-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            <Video className="size-3" aria-hidden="true" />
                            <span>{evt.locationText}</span>
                          </a>
                        ) : (
                          <>
                            <Video className="size-3" aria-hidden="true" />
                            <span>{evt.locationText}</span>
                          </>
                        )}
                      </div>
                    )}
                    {evt.note && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {evt.note}
                      </div>
                    )}
                  </div>
                  {evt.leaderInitials && (
                    <div className="flex items-center -space-x-1.5">
                      <Avatar
                        initials={evt.leaderInitials}
                        name={evt.leaderName ?? undefined}
                      />
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
