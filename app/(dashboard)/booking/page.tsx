"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { EventType } from "@prisma/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TypeTabs } from "@/components/booking/TypeTabs";
import { BookingCalendarMini } from "@/components/booking/BookingCalendarMini";
import { SlotTimeline } from "@/components/booking/SlotTimeline";
import { SlotGrid } from "@/components/booking/SlotGrid";
import { SlotViewToggle, SlotViewMode } from "@/components/booking/SlotViewToggle";
import { SlotBookingSheet } from "@/components/booking/SlotBookingSheet";
import { MyBookingsCards } from "@/components/booking/MyBookingsCards";
import { MeetingLinkCard } from "@/components/booking/MeetingLinkCard";
import { SlotData } from "@/components/booking/SlotCell";
import { bookSlotAction, cancelSlotAction } from "@/actions/slotActions";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarX2 } from "lucide-react";

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<EventType>((searchParams.get("type") as EventType) || "BIBLE");
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [meetingLink, setMeetingLink] = useState<{ url: string, label: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SlotData | null>(null);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [myBookedDates, setMyBookedDates] = useState<Set<string>>(new Set());
  const [view, setView] = useState<SlotViewMode>("grid");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`);
        const data = await res.json();
        
        if (data.success) {
          setSlots(data.data.slots);
          setMeetingLink(data.data.meetingLinks[type]);

          const dateStr = format(date, "yyyy-MM-dd");
          const slotList = data.data.slots as { isBooked: boolean; isOwnBooking: boolean }[];
          const hasAny = slotList.some((s) => s.isBooked);
          const hasOwn = slotList.some((s) => s.isOwnBooking);
          setBookedDates((prev) => {
            const next = new Set(prev);
            if (hasAny) next.add(dateStr);
            else next.delete(dateStr);
            return next;
          });
          setMyBookedDates((prev) => {
            const next = new Set(prev);
            if (hasOwn) next.add(dateStr);
            else next.delete(dateStr);
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to fetch slots", error);
      } finally {
        setIsLoading(false);
        setSelectedIds([]);
      }
    };

    fetchSlots();
  }, [date, type]);

  const handleTypeChange = (newType: EventType) => {
    setType(newType);
    router.replace(`/booking?type=${newType}`, { scroll: false });
  };

  const handleConfirmBooking = async (notes: string) => {
    setIsSubmitting(true);
    
    const result = await bookSlotAction({ slotIds: selectedIds, notes });
    
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Slots booked successfully");
      setSheetOpen(false);
      setSelectedIds([]);
      // Refresh slots
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`);
      const data = await res.json();
      if (data.success) setSlots(data.data.slots);
    } else {
      toast.error(result.error || "Failed to book slots");
    }
  };

  const handleCancelBooking = (slot: SlotData) => {
    setCancelTarget(slot);
  };

  const confirmCancelBooking = async () => {
    if (!cancelTarget) return;
    const result = await cancelSlotAction({ slotId: cancelTarget.id });
    setCancelTarget(null);
    if (result.success) {
      toast.success("Booking cancelled");
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`);
      const data = await res.json();
      if (data.success) setSlots(data.data.slots);
    } else {
      toast.error(result.error || "Failed to cancel booking");
    }
  };

  const myBookings = slots.filter(s => s.isOwnBooking);
  const selectedSlots = slots.filter(s => selectedIds.includes(s.id));

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Slot Booking</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {format(date, "EEEE, MMMM d")}
          <Badge variant="secondary">
            {type === "BIBLE" ? "Bible Reading" : type === "PRAYER" ? "Prayer" : "Praise & Worship"}
          </Badge>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 lg:w-1/4 space-y-6">
          <BookingCalendarMini 
            date={date} 
            onDateChange={(d) => d && setDate(d)} 
            bookedDates={bookedDates}
            myBookedDates={myBookedDates}
            type={type}
          />
          
          <div className="hidden md:block">
            <h3 className="font-semibold mb-3">My Bookings for {format(date, "MMM d")}</h3>
            <MyBookingsCards 
              bookings={myBookings} 
              onCancel={handleCancelBooking} 
              type={type}
            />
          </div>
          
          {meetingLink && (
            <div className="hidden md:block">
              <MeetingLinkCard url={meetingLink.url} label={meetingLink.label} />
            </div>
          )}
        </div>

        <div className="md:w-2/3 lg:w-3/4 space-y-4">
          <TypeTabs value={type} onChange={handleTypeChange} />

          <div className="flex justify-end">
            <SlotViewToggle view={view} onViewChange={setView} />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-[44px] w-full" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {view === "grid" ? (
                <SlotGrid
                  slots={slots}
                  type={type}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onEmptyAction={() => setSelectedIds([])}
                />
              ) : (
                <SlotTimeline
                  slots={slots}
                  type={type}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onEmptyAction={() => setSelectedIds([])}
                />
              )}
              
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div
                    key="book-selected-bar"
                    initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { y: 24, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="fixed bottom-4 left-0 right-0 z-10 flex justify-center px-4 md:px-0"
                  >
                    <div className="flex w-full items-center gap-4 rounded-full border bg-popover px-4 py-2 shadow-lg md:w-auto">
                      <span className="text-sm font-medium tabular-nums">
                        {selectedIds.length} slot{selectedIds.length === 1 ? "" : "s"} selected
                      </span>
                      <Button size="sm" onClick={() => setSheetOpen(true)} className="rounded-full">
                        Book Selected
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="md:hidden space-y-6 pt-6">
            <div>
              <h3 className="font-semibold mb-3">My Bookings</h3>
              <MyBookingsCards 
                bookings={myBookings} 
                onCancel={handleCancelBooking} 
                type={type}
              />
            </div>
            {meetingLink && (
              <MeetingLinkCard url={meetingLink.url} label={meetingLink.label} />
            )}
          </div>
        </div>
      </div>

      <SlotBookingSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen}
        selectedSlots={selectedSlots}
        type={type}
        onConfirm={handleConfirmBooking}
        isSubmitting={isSubmitting}
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarX2 className="size-4 text-destructive" aria-hidden="true" />
              Cancel this booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `Your ${type.replace("_", " ").toLowerCase()} slot at ${cancelTarget.startTime} will be freed for others.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelBooking}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
