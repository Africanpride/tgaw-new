"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, isBefore, isAfter, parseISO } from "date-fns";
import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isPastSlot } from "./slotTime";
import { slotAccent } from "./slotAccent";
import { Calendar, Video, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventType } from "@prisma/client";
import { PastBookingsStack } from "./PastBookingsStack";

type ScheduleTab = "this-week" | "next-week";

interface ScheduleViewProps {
  bookings: SlotData[];
  meetingLinks: Record<EventType, { url: string; label: string | null } | null>;
  onCancel: (slot: SlotData) => void;
}

function getTypeLabel(type: EventType | undefined): string {
  if (!type) return "Session";
  return type === "BIBLE" ? "Bible Reading" : type === "PRAYER" ? "Prayer" : "Praise & Worship";
}

function getMeetingLink(links: Record<EventType, { url: string; label: string | null } | null>, type: EventType | undefined) {
  if (!type) return null;
  return links[type] || null;
}

export function ScheduleView({ bookings, meetingLinks, onCancel }: ScheduleViewProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("this-week");

  const filteredBookings = useMemo(() => {
    const currentTime = new Date();
    const weekStart = startOfWeek(currentTime, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentTime, { weekStartsOn: 1 });
    const nextWeekStartDate = addWeeks(weekStart, 1);
    const nextWeekEndDate = addWeeks(weekEnd, 1);
    
    return bookings.filter((booking) => {
      if (!booking.date) return false;
      const bookingDate = parseISO(booking.date);
      
      switch (activeTab) {
        case "this-week":
          return !isBefore(bookingDate, weekStart) && !isAfter(bookingDate, weekEnd);
        case "next-week":
          return !isBefore(bookingDate, nextWeekStartDate) && !isAfter(bookingDate, nextWeekEndDate);
        default:
          return true;
      }
    });
  }, [bookings, activeTab]);

  const groupedBookings = useMemo(() => {
    const groups: Record<string, SlotData[]> = {};
    
    filteredBookings.forEach((booking) => {
      if (!booking.date) return;
      const dateKey = format(parseISO(booking.date), "EEE, MMM d");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => parseISO(a).getTime() - parseISO(b).getTime());
  }, [filteredBookings]);

  const emptyMessage = activeTab === "this-week"
    ? "No bookings this week"
    : "No bookings next week";

  const tabsContent = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScheduleTab)} className="w-full">
      <TabsList className="group-data-[orientation=horizontal]:h-9 bg-muted p-[3px] rounded-lg w-full">
        <TabsTrigger value="this-week" className="text-xs flex-1">This week</TabsTrigger>
        <TabsTrigger value="next-week" className="text-xs flex-1">Next week</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  if (filteredBookings.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <div className="border-b px-4">{tabsContent}</div>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center flex-1">
          <Calendar className="size-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">{emptyMessage}</p>
          <p className="mt-1 text-xs text-muted-foreground">Book a slot to see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="border-b px-4">{tabsContent}</div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Past Bookings Stack */}
          <PastBookingsStack bookings={bookings} />

          {/* Upcoming Bookings */}
          {groupedBookings.map(([dateLabel, dayBookings]) => (
            <div key={dateLabel} className="space-y-2">
              <span className="block text-xs font-medium text-muted-foreground">
                {dateLabel}
              </span>
              {dayBookings
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((booking) => {
                  const past = isPastSlot(booking);
                  if (past) return null; // Past bookings shown in stack above
                  const type = booking.type as EventType | undefined;
                  const accent = type ? slotAccent[type] : slotAccent.BIBLE;
                  const typeLabel = getTypeLabel(type);
                  const meetingLink = getMeetingLink(meetingLinks, type);
                  const dotColor = "hsl(var(--primary))";

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "flex gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/30"
                      )}
                    >
                      <div className="flex w-20 shrink-0 flex-col items-end pt-0.5">
                        <span className="font-mono text-sm font-medium tabular-nums">
                          {convertUtcTimeToLocal(booking.startTime)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {convertUtcTimeToLocal(booking.endTime)}
                        </span>
                      </div>

                      <div className="relative flex w-px flex-col items-center">
                        <div className="h-full w-px bg-border" />
                        <span 
                          className="absolute top-1 size-2 rounded-full ring-2 ring-card" 
                          style={{ backgroundColor: dotColor }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="default" 
                            className={cn("text-[10px] shrink-0", accent.solid)}
                          >
                            {typeLabel}
                          </Badge>
                        </div>

                        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          {meetingLink && (
                            <>
                              <Video className="size-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{meetingLink.label || "Video Call"}</span>
                              <Link2 className="size-2.5 shrink-0" aria-hidden="true" />
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center" role="group" aria-label={"Attendees for " + typeLabel}>
                            <div className="flex -space-x-1.5">
                              {booking.bookedByName && booking.bookedByImage && (
                                <Avatar className="h-5 w-5 border border-card text-[8px]" title={booking.bookedByName}>
                                  <AvatarImage src={booking.bookedByImage} alt={booking.bookedByName} />
                                  <AvatarFallback className="text-xs">
                                    {booking.bookedByName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {booking.bookedByName && !booking.bookedByImage && (
                                <Avatar className="h-5 w-5 border border-card text-[8px]" title={booking.bookedByName}>
                                  <AvatarFallback className="text-xs">
                                    {booking.bookedByName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {booking.isOwnBooking && !booking.bookedByName && (
                                <Avatar className="h-5 w-5 border border-card text-[8px]" title="You">
                                  <AvatarFallback className="text-xs">You</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              {booking.isOwnBooking 
                                ? "You organized" 
                                : booking.bookedByName 
                                  ? "with " + booking.bookedByName 
                                  : "Booked"}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                            onClick={() => onCancel(booking)}
                          >
                            <span className="sr-only">Cancel booking</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}