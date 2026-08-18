"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { EventType } from "@prisma/client"
import { TypeTabs } from "@/components/booking/TypeTabs"
import { BookingCalendarMini } from "@/components/booking/BookingCalendarMini"
import { SlotTimeline } from "@/components/booking/SlotTimeline"
import { SlotGrid } from "@/components/booking/SlotGrid"
import {
  SlotViewToggle,
  SlotViewMode,
} from "@/components/booking/SlotViewToggle"
import { SlotBookingSheet } from "@/components/booking/SlotBookingSheet"
import { MyBookingsStack } from "@/components/booking/MyBookingsStack"
import { MeetingLinkCard } from "@/components/booking/MeetingLinkCard"
import { SlotData } from "@/components/booking/SlotCell"
import { convertUtcTimeToLocal, isPastSlot } from "@/components/booking/slotTime"
import { slotAccent } from "@/components/booking/slotAccent"
import { bookSlotAction, cancelSlotAction } from "@/actions/slotActions"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CalendarX2, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScheduleView } from "@/components/booking/ScheduleView"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [date, setDate] = useState<Date>(new Date())
  const [type, setType] = useState<EventType>(
    (searchParams.get("type") as EventType) || "BIBLE"
  )
  const [slots, setSlots] = useState<SlotData[]>([])
  const [allMyBookings, setAllMyBookings] = useState<SlotData[]>([])
  const [meetingLink, setMeetingLink] = useState<{
    url: string
    label: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<SlotData | null>(null)
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [myBookedDates, setMyBookedDates] = useState<Set<string>>(new Set())
  const [view, setView] = useState<SlotViewMode>("grid")
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true)
      try {
        const dateStr = format(date, "yyyy-MM-dd")
        const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`)
        const data = await res.json()

        if (data.success) {
          setSlots(data.data.slots)
          setMeetingLink(data.data.meetingLinks[type])

          const dateStr = format(date, "yyyy-MM-dd")
          const slotList = data.data.slots as {
            isBooked: boolean
            isOwnBooking: boolean
          }[]
          const hasAny = slotList.some((s) => s.isBooked)
          const hasOwn = slotList.some((s) => s.isOwnBooking)
          setBookedDates((prev) => {
            const next = new Set(prev)
            if (hasAny) next.add(dateStr)
            else next.delete(dateStr)
            return next
          })
          setMyBookedDates((prev) => {
            const next = new Set(prev)
            if (hasOwn) next.add(dateStr)
            else next.delete(dateStr)
            return next
          })
        }
      } catch (error) {
        console.error("Failed to fetch slots", error)
      } finally {
        setIsLoading(false)
        setSelectedIds([])
      }
    }

    fetchSlots()
  }, [date, type])

  // Fetch all my bookings across all types for the date
  useEffect(() => {
    const fetchAllMyBookings = async () => {
      try {
        const dateStr = format(date, "yyyy-MM-dd")
        const types: EventType[] = ["BIBLE", "PRAYER", "PRAISE_WORSHIP"]
        const allBookings: SlotData[] = []

        for (const t of types) {
          const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${t}&_=${Date.now()}`)
          const data = await res.json()
          console.log(`[DEBUG] Type ${t}:`, data.success, data.data?.slots?.length, data.data?.slots?.filter((s: SlotData) => s.isOwnBooking).length)
          if (data.success) {
            const ownBookings = (data.data.slots as SlotData[]).filter(
              (s) => s.isOwnBooking
            )
            allBookings.push(...ownBookings)
          }
        }

        // Sort by start time
        allBookings.sort((a, b) => a.startTime.localeCompare(b.startTime))
        console.log('[DEBUG] allMyBookings:', allBookings)
        setAllMyBookings(allBookings)
      } catch (error) {
        console.error("Failed to fetch all my bookings", error)
      }
    }

    fetchAllMyBookings()
  }, [date])

  const handleTypeChange = (newType: EventType) => {
    setType(newType)
    router.replace(`/booking?type=${newType}`, { scroll: false })
  }

  const handleConfirmBooking = async (notes: string) => {
    setIsSubmitting(true)

    const result = await bookSlotAction({ slotIds: selectedIds, notes })

    setIsSubmitting(false)
    if (result.success) {
      toast.success("Slots booked successfully")
      setSheetOpen(false)
      setSelectedIds([])
      // Refresh slots
      const dateStr = format(date, "yyyy-MM-dd")
      const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`)
      const data = await res.json()
      if (data.success) setSlots(data.data.slots)
    } else {
      toast.error(result.error || "Failed to book slots")
    }
  }

  const handleCancelBooking = (slot: SlotData) => {
    if (isPastSlot(slot)) {
      toast.error("Cannot cancel a booking that is in the past")
      return
    }
    setCancelTarget(slot)
  }

  const confirmCancelBooking = async () => {
    if (!cancelTarget) return
    const result = await cancelSlotAction({ slotId: cancelTarget.id })
    setCancelTarget(null)
    if (result.success) {
      toast.success("Booking cancelled")
      const dateStr = format(date, "yyyy-MM-dd")
      const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`)
      const data = await res.json()
      if (data.success) setSlots(data.data.slots)
    } else {
      toast.error(result.error || "Failed to cancel booking")
    }
  }

  const myBookings = allMyBookings
  const selectedSlots = slots.filter((s) => selectedIds.includes(s.id))

  const typeLabel =
    type === "BIBLE"
      ? "Bible Reading"
      : type === "PRAYER"
        ? "Prayer"
        : "Praise & Worship"
  const accent = slotAccent[type]

  return (
    <div className="max-w-8xl container mx-auto space-y-6 p-4">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Slot Booking</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {format(date, "EEEE, MMMM d")}
            <Badge variant="secondary">{typeLabel}</Badge>
          </p>
        </div>
        <div>
          <div className="flex justify-end">
            <SlotViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left Column: Calendar + My Bookings + Meeting Links */}
        <div className="space-y-6 md:w-1/4 lg:w-2/5 min-w-0">
          <BookingCalendarMini
            date={date}
            onDateChange={(d) => d && setDate(d)}
            bookedDates={bookedDates}
            myBookedDates={myBookedDates}
            type={type}
          />

          {/* <div className="hidden md:block">
            <h3 className="mb-3 font-semibold">
              My Bookings for {format(date, "MMM d")}
            </h3>
            <MyBookingsStack
              bookings={myBookings}
              onCancel={handleCancelBooking}
              dateLabel={format(date, "MMM d")}
            />
          </div> */}

          {meetingLink && (
            <div className="hidden md:block">
              <MeetingLinkCard
                url={meetingLink.url}
                label={meetingLink.label}
              />
            </div>
          )}
        </div>

        {/* Middle Column: Slot Grid/Timeline for Booking */}
        <div className="space-y-4 md:w-1/2 lg:w-3/5 min-w-0">
          <TypeTabs value={type} onChange={handleTypeChange} />

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
                    className="fixed right-0 bottom-4 left-0 z-10 flex justify-center px-4 md:px-0"
                  >
                    <div className="flex w-full items-center gap-4 rounded-full border bg-popover px-4 py-2 shadow-lg md:w-auto">
                      <span className="text-sm font-medium tabular-nums">
                        {selectedIds.length} slot
                        {selectedIds.length === 1 ? "" : "s"} selected
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setSheetOpen(true)}
                        className="rounded-full"
                      >
                        Book Selected
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="space-y-6 pt-6 md:hidden">
            <div>
              <h3 className="mb-3 font-semibold">My Bookings</h3>
              <MyBookingsStack
                bookings={myBookings}
                onCancel={handleCancelBooking}
                dateLabel={format(date, "MMM d")}
              />
            </div>
            {meetingLink && (
              <MeetingLinkCard
                url={meetingLink.url}
                label={meetingLink.label}
              />
            )}
          </div>
        </div>

        {/* Right Column: Schedule View */}
        {/* <div className="md:w-1/4 lg:w-1/5 min-w-0 hidden md:block">
          <ScheduleView
            bookings={allMyBookings}
            meetingLinks={meetingLink ? { [type]: meetingLink, BIBLE: null, PRAYER: null, PRAISE_WORSHIP: null } as Record<EventType, { url: string; label: string | null } | null> : { BIBLE: null, PRAYER: null, PRAISE_WORSHIP: null } as Record<EventType, { url: string; label: string | null } | null>}
            onCancel={handleCancelBooking}
          />
        </div> */}
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
        <AlertDialogContent className="sm:max-w-[26rem]">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <CalendarX2
                className="size-5 text-destructive"
                aria-hidden="true"
              />
            </div>
            <AlertDialogHeader className="gap-1.5">
              <AlertDialogTitle className="text-base sm:text-lg">
                Cancel this booking?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This frees the slot for another member to book. You can book it
                again if you change your mind.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          {cancelTarget && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Badge className={cn("shrink-0", accent.solid)}>
                  {typeLabel}
                </Badge>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold tabular-nums">
                    {convertUtcTimeToLocal(cancelTarget.startTime)}
                    <span className="text-muted-foreground">
                      {" "}
                      &ndash; {convertUtcTimeToLocal(cancelTarget.endTime)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cancelTarget.date
                      ? format(
                          new Date(`${cancelTarget.date}T00:00:00`),
                          "EEEE, MMMM d",
                        )
                      : format(date, "EEEE, MMMM d")}
                  </span>
                </div>
              </div>
              <Clock
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
              )}
            >
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelBooking}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "cursor-pointer",
              )}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
