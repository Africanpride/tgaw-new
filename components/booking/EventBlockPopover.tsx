"use client";

import { CalendarClock, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { convertUtcTimeToLocal } from "./slotTime";
import type { EventSummary } from "@/lib/services/slotEventEnrichment";
import { cn } from "@/lib/utils";

interface EventBlockPopoverProps {
  event: EventSummary;
  children: React.ReactNode;
  contentClassName?: string;
}

/**
 * Details popover for a slot blocked by a Special Event. The trigger is the
 * blocked cell/badge itself; the popover explains which event took precedence
 * (title, local time window) and offers its Zoom link when available.
 */
export function EventBlockPopover({ event, children, contentClassName }: EventBlockPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className={cn("w-64 p-4", contentClassName)} role="dialog" aria-label={`Special event: ${event.title}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Special Event
          </div>
          <p className="font-semibold leading-snug">{event.title}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {convertUtcTimeToLocal(event.startTime)} &ndash; {convertUtcTimeToLocal(event.endTime)}
          </p>
          <div className="flex items-center gap-2 pt-1">
            {event.zoomUrl && (
              <Button size="sm" asChild className="h-8">
                <a href={event.zoomUrl} target="_blank" rel="noreferrer">
                  Join Meeting
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground">
              <Link href="/calendar" className="cursor-pointer">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                View in calendar
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface EventBlockBadgeProps {
  event?: EventSummary | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * Violet "Event" badge marking a precedence-blocked slot. When event details
 * are known, the badge doubles as the details popover trigger.
 */
export function EventBlockBadge({ event, children, className }: EventBlockBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      tabIndex={event ? 0 : undefined}
      aria-label={event ? `Special event: ${event.title}` : undefined}
      className={cn(
        "gap-1 border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        event && "cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      {children}
    </Badge>
  );
  if (!event) return badge;
  return <EventBlockPopover event={event}>{badge}</EventBlockPopover>;
}
