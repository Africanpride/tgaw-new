"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { EventType } from "@prisma/client";
import { TypeTabs } from "@/components/booking/TypeTabs";
import { BookingCalendarMini } from "@/components/booking/BookingCalendarMini";
import { SlotTimeline } from "@/components/booking/SlotTimeline";
import { SlotBookingSheet } from "@/components/booking/SlotBookingSheet";
import { MyBookingsCards } from "@/components/booking/MyBookingsCards";
import { MeetingLinkCard } from "@/components/booking/MeetingLinkCard";
import { SlotData } from "@/components/booking/SlotCell";
import { bookSlotAction, cancelSlotAction } from "@/actions/slotActions";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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
        }
      } catch (error) {
        console.error("Failed to fetch slots", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
    setSelectedIds([]);
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

  const handleCancelBooking = async (slotId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    const result = await cancelSlotAction({ slotId });
    if (result.success) {
      toast.success("Booking cancelled");
      // Refresh slots
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
        <p className="text-muted-foreground">Book your devotional time slots.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 lg:w-1/4 space-y-6">
          <BookingCalendarMini 
            date={date} 
            onDateChange={(d) => d && setDate(d)} 
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
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-[44px] w-full" />
              ))}
            </div>
          ) : (
            <div className="relative">
              <SlotTimeline 
                slots={slots} 
                type={type} 
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
              
              {selectedIds.length > 0 && (
                <div className="fixed bottom-4 left-0 right-0 md:absolute md:bottom-4 md:left-4 md:right-4 flex justify-center z-10 px-4 md:px-0">
                  <div className="bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 w-full md:w-auto">
                    <span className="text-sm font-medium">{selectedIds.length} slots selected</span>
                    <button 
                      onClick={() => setSheetOpen(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ml-auto md:ml-0"
                    >
                      Book Selected
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
}
