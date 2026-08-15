"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { EventType } from "@prisma/client"
import { toast } from "sonner"
import { Check, Copy, Link2, Loader2, Save, Trash2, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { slotAccent } from "./slotAccent"

interface MeetingLinkData {
  url: string
  label: string | null
}

export function AdminMeetingLinkManager() {
  const [type, setType] = useState<EventType>("BIBLE")
  const [date, setDate] = useState<Date>(new Date())
  const [url, setUrl] = useState("")
  const [label, setLabel] = useState("")
  const [currentLink, setCurrentLink] = useState<MeetingLinkData | null>(null)
  const [isLoadingLink, setIsLoadingLink] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string
    date: string
  } | null>(null)
  const reduceMotion = useReducedMotion()

  const accent = slotAccent[type]
  const typeLabel =
    type === "BIBLE"
      ? "Bible Reading"
      : type === "PRAYER"
        ? "Prayer"
        : "Praise & Worship"

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoadingLink(true)
      try {
        const dateStr = format(date, "yyyy-MM-dd")
        const res = await fetch(`/api/v1/slots?date=${dateStr}&type=${type}`)
        const data = await res.json()
        if (!cancelled) {
          setCurrentLink(
            data.success ? (data.data.meetingLinks?.[type] ?? null) : null
          )
        }
      } catch {
        if (!cancelled) setCurrentLink(null)
      } finally {
        if (!cancelled) setIsLoadingLink(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [type, date])

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error("Meeting URL is required")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/slots/meeting-link", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date: format(date, "yyyy-MM-dd"),
          url: url.trim(),
          label: label.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Meeting link saved")
        setCurrentLink({ url: url.trim(), label: label.trim() || null })
        setUrl("")
        setLabel("")
      } else {
        toast.error(data.error?.message || "Failed to save meeting link")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!currentLink) return
    try {
      await navigator.clipboard.writeText(currentLink.url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleDelete = () => {
    setDeleteTarget({ type, date: format(date, "yyyy-MM-dd") })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteTarget(null)
    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/v1/slots/meeting-link?type=${deleteTarget.type}&date=${deleteTarget.date}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (data.success) {
        toast.success("Meeting link deleted")
        setCurrentLink(null)
      } else {
        toast.error(data.error?.message || "Failed to delete meeting link")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Video className="size-4 text-primary" aria-hidden="true" />
          </div>
          Meeting Link Manager
        </CardTitle>
        <CardDescription>
          Set the shared meeting link for a slot type on a specific day. Members
          see it once they have a booking.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ml-type">Slot type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as EventType)}
              >
                <SelectTrigger id="ml-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIBLE">Bible Reading</SelectItem>
                  <SelectItem value="PRAYER">Prayer</SelectItem>
                  <SelectItem value="PRAISE_WORSHIP">
                    Praise & Worship
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="w-full rounded-md border p-1">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="w-full rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ml-url">Meeting URL</Label>
              <Input
                id="ml-url"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml-label">
                Label <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ml-label"
                placeholder="e.g. Morning Prayer Room"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden="true" />
                    Save Link
                  </>
                )}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isSaving || !currentLink}
                variant="outline"
                className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="mb-0">
              Link for {format(date, "EEEE, MMMM d")}
            </Label>
            <Badge className={cn("border-0", accent.tabFill, accent.text)}>
              {typeLabel}
            </Badge>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {isLoadingLink ? (
              <div
                key="loading"
                className="flex h-[52px] items-center justify-center rounded-md border bg-muted/30"
              >
                <Loader2
                  className="size-4 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            ) : currentLink ? (
              <motion.div
                key="link"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    accent.iconTile
                  )}
                >
                  <Video className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">
                      {currentLink.label || "Meeting link"}
                    </span>
                    <Badge className="shrink-0 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Live
                    </Badge>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentLink.url}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  aria-label={copied ? "Link copied" : "Copy meeting link"}
                >
                  {copied ? (
                    <Check
                      className="size-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex h-[52px] items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground"
              >
                <Link2 className="size-4" aria-hidden="true" />
                No link set for this day yet.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-[26rem]">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-5 text-destructive" aria-hidden="true" />
            </div>
            <AlertDialogHeader className="gap-1.5">
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete meeting link?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This removes the meeting link for this day. Booked slots are not
                affected — members just won&apos;t see a link.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          {deleteTarget && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <Badge className={cn("border-0", accent.solid)}>
                  {typeLabel}
                </Badge>
                <span className="text-sm font-medium">
                  {format(
                    new Date(`${deleteTarget.date}T00:00:00`),
                    "EEEE, MMMM d"
                  )}
                </span>
              </div>
              <Video
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer"
              )}
            >
              Keep link
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "cursor-pointer"
              )}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
