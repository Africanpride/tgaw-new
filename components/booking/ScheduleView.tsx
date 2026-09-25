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
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listRowClass } from "@/components/list-row";
import { EventType } from "@prisma/client";
import { PastBookingsStack } from "./PastBookingsStack";
import { useTranslation } from "react-i18next";
import { dateLocale } from "@/lib/date-locale";

type ScheduleTab = "this-week" | "next-week";

interface ScheduleViewProps {
  bookings: SlotData[];
  meetingLinks: Record<EventType, { url: string; label: string | null } | null>;
  onCancel: (slot: SlotData) => void;
}

function getTypeLabel(type: EventType | undefined, t: (key: string) => string): string {
  if (!type) return t("type.session");
  return type === "BIBLE" ? t("type.bible") : type === "PRAYER" ? t("type.prayer") : t("type.worship");
}

function getMeetingLink(links: Record<EventType, { url: string; label: string | null } | null>, type: EventType | undefined) {
  if (!type) return null;
  return links[type] || null;
}

export function ScheduleView({ bookings, meetingLinks, onCancel }: ScheduleViewProps) {
  const { t, i18n } = useTranslation("booking");
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
      const dateKey = format(parseISO(booking.date), "EEE, MMM d", { locale: dateLocale(i18n.language) });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => parseISO(a).getTime() - parseISO(b).getTime());
  }, [filteredBookings, i18n.language]);

  const emptyMessage = activeTab === "this-week"
    ? t("schedule.emptyThisWeek")
    : t("schedule.emptyNextWeek");

  const tabsContent = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScheduleTab)} className="w-full">
      <TabsList className="group-data-[orientation=horizontal]:h-9 bg-muted p-[3px] rounded-lg w-full">
        <TabsTrigger value="this-week" className="text-xs flex-1">{t("schedule.thisWeek")}</TabsTrigger>
        <TabsTrigger value="next-week" className="text-xs flex-1">{t("schedule.nextWeek")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  if (filteredBookings.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <div className="border-b px-2 sm:px-4">{tabsContent}</div>
        <CardContent className="flex flex-col items-center justify-center p-2 text-center flex-1 sm:p-8">
          <Calendar className="size-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">{emptyMessage}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("schedule.emptyHint")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="border-b px-2 sm:px-4">{tabsContent}</div>

      <ScrollArea className="flex-1 p-2 sm:p-4">
        <div className="space-y-4">
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
                  if (past) return null; // Past bookings shown in stack below
                  const type = booking.type as EventType | undefined;
                  const accent = type ? slotAccent[type] : slotAccent.BIBLE;
                  const typeLabel = getTypeLabel(type, t);
                  const meetingLink = getMeetingLink(meetingLinks, type);
                  const dotColor = "hsl(var(--primary))";

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        listRowClass,
                        "flex gap-3 px-2 sm:px-3 py-2.5 hover:bg-muted/30"
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
                              <span className="truncate">{meetingLink.label || t("meeting.videoCall")}</span>
                              <Link2 className="size-2.5 shrink-0" aria-hidden="true" />
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center" role="group" aria-label={t("schedule.attendeesAria", { type: typeLabel })}>
                            <div className="flex -space-x-1.5">
                              {booking.bookedByName && (
                                <UserAvatar
                                  name={booking.bookedByName}
                                  image={booking.bookedByImage}
                                  className="size-5 border border-card"
                                />
                              )}
                              {booking.isOwnBooking && !booking.bookedByName && (
                                <UserAvatar
                                  name={t("schedule.you")}
                                  className="size-5 border border-card"
                                />
                              )}
                            </div>
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              {booking.isOwnBooking
                                ? t("schedule.youOrganized")
                                : booking.bookedByName
                                  ? t("schedule.withName", { name: booking.bookedByName })
                                  : t("chip.booked")}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                            onClick={() => onCancel(booking)}
                          >
                            <span className="sr-only">{t("action.cancelBooking")}</span>
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

          {/* Past Bookings Stack */}
          <PastBookingsStack bookings={bookings} />
        </div>
      </ScrollArea>
    </Card>
  );
}