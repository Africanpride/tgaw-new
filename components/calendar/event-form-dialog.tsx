"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import {
  BookMarked,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Flame,
  Loader2,
  Music,
  Sparkles,
  Timer,
  Video,
  TriangleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/schemas/eventSchema"
import { cn } from "@/lib/utils"
import type { CalendarItem } from "./calendar-view"

const EVENT_TYPES = [
  {
    id: "BIBLE" as const,
    label: "Bible Reading",
    description: "Scripture study & plan",
    icon: BookOpen,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    btnBg: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    id: "PRAYER" as const,
    label: "Prayer Watch",
    description: "Intercession & watch",
    icon: Flame,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    btnBg: "bg-red-600 hover:bg-red-700 text-white",
  },
  {
    id: "PRAISE_WORSHIP" as const,
    label: "Praise & Worship",
    description: "Music & adoration",
    icon: Music,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  {
    id: "SPECIAL" as const,
    label: "Special Event",
    description: "Org-wide gathering",
    icon: CalendarDays,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    btnBg: "bg-violet-600 hover:bg-violet-700 text-white",
  },
]

export interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  event?: CalendarItem | null
}

export function EventFormDialog({
  open,
  onOpenChange,
  mode = "create",
  event,
}: EventFormDialogProps) {
  const router = useRouter()
  const isEdit = mode === "edit" && Boolean(event)

  const defaultValues: CreateEventInput = useMemo(() => {
    if (mode === "edit" && event) {
      return {
        type: event.type,
        title: event.title ?? "",
        passage: event.passage ?? "",
        date: event.rawDate ?? event.date,
        time: event.rawTime ?? event.startTime,
        duration: event.duration ?? 30,
        zoomUrl: event.zoomUrl ?? "",
        notes: event.notes ?? "",
        blockTypes:
          (event.blockTypes as ("BIBLE" | "PRAYER" | "PRAISE_WORSHIP")[]) ?? [],
      }
    }
    return {
      type: "BIBLE",
      title: "",
      passage: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      duration: 30,
      zoomUrl: "",
      notes: "",
      blockTypes: [],
    }
  }, [mode, event])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    values: open ? defaultValues : undefined,
    resetOptions: {
      keepDirtyValues: false,
    },
  })

  const type = useWatch({ control, name: "type" }) ?? "BIBLE"
  const blockTypes = useWatch({ control, name: "blockTypes" }) ?? []
  const currentTypeConfig =
    EVENT_TYPES.find((t) => t.id === type) ?? EVENT_TYPES[0]
  const TypeIcon = currentTypeConfig.icon

  const isSpecial = type === "SPECIAL"

  const [previewWarning, setPreviewWarning] = useState<{
    blockedSlotCount: number
    displacingCount: number
  } | null>(null)

  async function submitEvent(values: CreateEventInput, confirmed: boolean) {
    const isEditMode = mode === "edit" && event?.rawEventId
    const url = isEditMode
      ? `/api/v1/events/${event.rawEventId}`
      : "/api/v1/events"
    const method = isEditMode ? "PATCH" : "POST"

    const body = isSpecial
      ? {
          ...values,
          blockTypes: values.blockTypes ?? [],
          ...(confirmed ? { _confirm: true } : { _preview: true }),
        }
      : { ...values, ...(confirmed ? { _confirm: true } : { _preview: true }) }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return json
  }

  async function onSubmit(values: CreateEventInput) {
    const isEditMode = mode === "edit" && event?.rawEventId

    // Step 1: preview — if the event would displace booked slots, ask first.
    if (!previewWarning) {
      if (!isEditMode) {
        const preview = await submitEvent(values, false)
        if (preview.success && preview.data?.willDisplace) {
          setPreviewWarning({
            blockedSlotCount: preview.data.blockedSlotCount,
            displacingCount: preview.data.displacingCount,
          })
          return
        }
        if (
          preview.code === "NEEDS_CONFIRM" ||
          (preview.data?.displacingCount && preview.data.displacingCount > 0)
        ) {
          setPreviewWarning({
            blockedSlotCount:
              preview.data?.blockedSlotCount ?? preview.data?.displacingCount,
            displacingCount: preview.data.displacingCount,
          })
          return
        }
      }

      // Direct submission
      const json = await submitEvent(values, true)
      if (json.success) {
        toast.success(
          isEditMode ? "Event updated successfully" : "Event created successfully"
        )
        onOpenChange(false)
        reset()
        router.refresh()
      } else {
        if (json.code === "NEEDS_CONFIRM" || json.data?.willDisplace) {
          setPreviewWarning({
            blockedSlotCount:
              json.data?.blockedSlotCount ?? json.data?.displacingCount ?? 1,
            displacingCount: json.data?.displacingCount ?? 1,
          })
        } else {
          toast.error(
            typeof json.error === "string"
              ? json.error
              : isEditMode
              ? "Could not update event"
              : "Could not create event"
          )
        }
      }
      return
    }

    // Step 2: user confirmed the override.
    const json = await submitEvent(values, true)
    if (json.success) {
      toast.success(
        isEditMode ? "Event updated successfully" : "Event created successfully"
      )
      onOpenChange(false)
      reset()
      setPreviewWarning(null)
      router.refresh()
    } else {
      toast.error(
        typeof json?.error === "string"
          ? json.error
          : isEditMode
          ? "Could not update event"
          : "Could not create event"
      )
    }
  }

  // Reset any preview warning when the dialog closes.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPreviewWarning(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden border-border/60 p-0 shadow-2xl sm:max-w-2xl">
        {/* Category-Accented Header */}
        <DialogHeader
          className={cn(
            "shrink-0 border-b border-border/40 px-5 py-3.5 transition-colors",
            currentTypeConfig.bg
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-xs",
                currentTypeConfig.border
              )}
            >
              <TypeIcon
                className={cn("size-4.5", currentTypeConfig.color)}
                aria-hidden="true"
              />
            </div>
            <div>
              <DialogTitle className="text-base tracking-tight">
                {isEdit ? "Edit Event" : "Add New Event"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEdit
                  ? "Update event details, timing, or blocking settings"
                  : "Schedule a new altar session or watch gathering"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[calc(88vh-70px)] space-y-3 overflow-y-auto p-5"
        >
          {/* 3-Way Card Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Event Category
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => {
                const isSelected = type === t.id
                const CardIcon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setValue("type", t.id, { shouldValidate: true })
                      if (t.id !== "SPECIAL") {
                        setValue("blockTypes", [], { shouldValidate: true })
                        setPreviewWarning(null)
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? cn(
                            "border-2 bg-background font-semibold shadow-2xs",
                            t.border
                          )
                        : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    <CardIcon
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? t.color : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate text-xs">{t.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="event-title" className="text-xs font-medium">
              Title
            </Label>
            <div className="relative">
              <Sparkles
                className="absolute top-2.5 left-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="event-title"
                placeholder="e.g., Morning Prayer Watch"
                className="h-9 pl-9 text-xs"
                {...register("title")}
              />
            </div>
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {isSpecial && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Block these slot types
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "BIBLE" as const, label: "Bible Reading" },
                  { id: "PRAYER" as const, label: "Prayer" },
                  { id: "PRAISE_WORSHIP" as const, label: "Praise & Worship" },
                ].map((opt) => {
                  const checked = (blockTypes as string[]).includes(opt.id)
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const current = (blockTypes as ("BIBLE" | "PRAYER" | "PRAISE_WORSHIP")[]) ?? []
                          const next = value
                            ? [...current, opt.id]
                            : current.filter((t) => t !== opt.id)
                          setValue("blockTypes", next, { shouldValidate: true })
                        }}
                        className="data-[state=checked]:bg-violet-500"
                      />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                No types checked — this event will only appear on the calendar.
              </p>
            </div>
          )}

          {/* Date, Time & Duration 3-Col Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="event-date" className="text-xs font-medium">
                Date
              </Label>
              <div className="relative">
                <Calendar
                  className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="event-date"
                  type="date"
                  className="h-9 pl-8 text-xs"
                  {...register("date")}
                />
              </div>
              {errors.date && (
                <p className="text-[11px] text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="event-time" className="text-xs font-medium">
                Time
              </Label>
              <div className="relative">
                <Clock
                  className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="event-time"
                  type="time"
                  className="h-9 pl-8 text-xs"
                  {...register("time")}
                />
              </div>
              {errors.time && (
                <p className="text-[11px] text-destructive">
                  {errors.time.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="event-duration" className="text-xs font-medium">
                Duration (min)
              </Label>
              <div className="relative">
                <Timer
                  className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="event-duration"
                  type="number"
                  min={1}
                  className="h-9 pl-8 text-xs"
                  {...register("duration", { valueAsNumber: true })}
                />
              </div>
              {errors.duration && (
                <p className="text-[11px] text-destructive">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          {/* Passage & Meeting URL 2-Col Grid */}
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <Label htmlFor="event-passage" className="text-xs font-medium">
                Passage / Focus
              </Label>
              <div className="relative">
                <BookMarked
                  className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="event-passage"
                  placeholder="Scripture or topic"
                  className="h-9 pl-8 text-xs"
                  {...register("passage")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="event-zoom-url" className="text-xs font-medium">
                Meeting URL
              </Label>
              <div className="relative">
                <Video
                  className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="event-zoom-url"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  className="h-9 pl-8 text-xs"
                  {...register("zoomUrl")}
                />
              </div>
              {errors.zoomUrl && (
                <p className="text-[11px] text-destructive">
                  {errors.zoomUrl.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="event-notes" className="text-xs font-medium">
              Notes
            </Label>
            <Textarea
              id="event-notes"
              placeholder="Add session notes or guidelines..."
              rows={2}
              className="min-h-[50px] resize-none text-xs"
              {...register("notes")}
            />
          </div>

          {previewWarning && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>
                This event will override{" "}
                <strong>{previewWarning.blockedSlotCount}</strong> slot(s),
                including {previewWarning.displacingCount} already-booked
                slot(s). Those users will be released. {isEdit ? "Update it anyway?" : "Create it anyway?"}
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            {previewWarning && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewWarning(null)}
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className={cn(
                "h-9 gap-1.5 px-4 text-xs font-medium shadow-2xs transition-all",
                currentTypeConfig.btnBg
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {previewWarning ? "Overriding..." : isEdit ? "Saving..." : "Creating..."}
                </>
              ) : previewWarning ? (
                "Confirm & Override"
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
