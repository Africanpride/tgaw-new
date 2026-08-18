"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { EventType } from "@prisma/client"
import { toast } from "sonner"
import { BookOpen, Check, Copy, Flame, Link2, Loader2, Music, Save, Trash2, Video } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Slide animation variants for tab content transitions
const tabSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}
const tabSlideTransition = { type: "spring" as const, stiffness: 340, damping: 32 }

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
  const [copied, setCopied] = useState<string | null>(null)

  // Default links state per activity type
  const [defaultLinks, setDefaultLinks] = useState<Record<EventType, MeetingLinkData | null>>({
    BIBLE: null,
    PRAYER: null,
    PRAISE_WORSHIP: null,
  })
  const [defaultInputs, setDefaultInputs] = useState<Record<EventType, { url: string; label: string }>>({
    BIBLE: { url: "", label: "" },
    PRAYER: { url: "", label: "" },
    PRAISE_WORSHIP: { url: "", label: "" },
  })
  const [savingDefaultType, setSavingDefaultType] = useState<EventType | null>(null)
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<{
    type: EventType
    date: string
  } | null>(null)
  const reduceMotion = useReducedMotion()

  // Default-tab underline animation state
  const defaultTabItems = [
    { id: "BIBLE" as EventType, label: "Bible", icon: BookOpen },
    { id: "PRAYER" as EventType, label: "Prayer", icon: Flame },
    { id: "PRAISE_WORSHIP" as EventType, label: "Worship", icon: Music },
  ] as const
  const [activeDefaultTab, setActiveDefaultTab] = useState<EventType>("BIBLE")
  const [hoveredDefaultTab, setHoveredDefaultTab] = useState<string | null>(null)
  const [defaultTabDir, setDefaultTabDir] = useState(1)
  const handleDefaultTabChange = (newId: string) => {
    const prevIdx = defaultTabItems.findIndex((t) => t.id === activeDefaultTab)
    const nextIdx = defaultTabItems.findIndex((t) => t.id === newId)
    setDefaultTabDir(nextIdx > prevIdx ? 1 : -1)
    setActiveDefaultTab(newId as EventType)
  }

  const accent = slotAccent[type]
  const typeLabel =
    type === "BIBLE"
      ? "Bible Reading"
      : type === "PRAYER"
        ? "Prayer"
        : "Praise & Worship"

  // Load default links for all 3 activity types
  const loadDefaults = async () => {
    setIsLoadingDefaults(true)
    try {
      const res = await fetch("/api/v1/slots?date=DEFAULT")
      const data = await res.json()
      if (data.success && data.data.meetingLinks) {
        setDefaultLinks({
          BIBLE: data.data.meetingLinks.BIBLE ?? null,
          PRAYER: data.data.meetingLinks.PRAYER ?? null,
          PRAISE_WORSHIP: data.data.meetingLinks.PRAISE_WORSHIP ?? null,
        })
        setDefaultInputs({
          BIBLE: {
            url: data.data.meetingLinks.BIBLE?.url || "",
            label: data.data.meetingLinks.BIBLE?.label || "",
          },
          PRAYER: {
            url: data.data.meetingLinks.PRAYER?.url || "",
            label: data.data.meetingLinks.PRAYER?.label || "",
          },
          PRAISE_WORSHIP: {
            url: data.data.meetingLinks.PRAISE_WORSHIP?.url || "",
            label: data.data.meetingLinks.PRAISE_WORSHIP?.label || "",
          },
        })
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDefaults(false)
    }
  }

  useEffect(() => {
    loadDefaults()
  }, [])

  // Load specific date link
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

  const handleSaveDefault = async (t: EventType) => {
    const input = defaultInputs[t]
    if (!input.url.trim()) {
      toast.error("Meeting URL is required")
      return
    }
    setSavingDefaultType(t)
    try {
      const res = await fetch("/api/v1/slots/meeting-link", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: t,
          date: "DEFAULT",
          url: input.url.trim(),
          label: input.label.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Default ${t === "BIBLE" ? "Bible" : t === "PRAYER" ? "Prayer" : "Worship"} meeting link saved`)
        await loadDefaults()
      } else {
        toast.error(data.error?.message || "Failed to save default link")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSavingDefaultType(null)
    }
  }

  const handleDeleteDefault = (t: EventType) => {
    setDeleteTarget({ type: t, date: "DEFAULT" })
  }

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
        toast.success("Date override meeting link saved")
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

  const handleCopy = async (targetUrl: string, key: string) => {
    try {
      await navigator.clipboard.writeText(targetUrl)
      setCopied(key)
      toast.success("Link copied to clipboard")
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleDelete = () => {
    setDeleteTarget({ type, date: format(date, "yyyy-MM-dd") })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/v1/slots/meeting-link?type=${target.type}&date=${target.date}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (data.success) {
        toast.success("Meeting link deleted")
        if (target.date === "DEFAULT") {
          await loadDefaults()
        } else {
          setCurrentLink(null)
        }
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
    <Card className="shadow-sm border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Video className="size-4 text-primary" aria-hidden="true" />
          </div>
          Meeting Link Manager
        </CardTitle>
        <CardDescription>
          Set permanent default Zoom/Teams links for each devotion type, or set date-specific link overrides.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* SECTION 1: DEFAULT ROOM LINKS (ALL DAYS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div>
              <h3 className="text-sm  tracking-tight">Default Meeting Links (All Days)</h3>
              <p className="text-xs text-muted-foreground">
                These links automatically apply to every calendar day unless overridden for a specific date.
              </p>
            </div>
          </div>

          <Tabs value={activeDefaultTab} onValueChange={handleDefaultTabChange} className="w-full">
            <TabsList
              variant="line"
              className="flex w-full no-visible-scrollbar! border-b border-border bg-transparent p-0! rounded-none h-auto! gap-0! justify-start!"
              onMouseLeave={() => setHoveredDefaultTab(null)}
            >
              {defaultTabItems.map((tab) => {
                const Icon = tab.icon
                const isActive = activeDefaultTab === tab.id
                const isHovered = hoveredDefaultTab === tab.id

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    onMouseEnter={() => setHoveredDefaultTab(tab.id)}
                    className={cn(
                      "relative flex items-center justify-center cursor-pointer text-sm font-medium transition-colors outline-none whitespace-nowrap bg-transparent",
                      "data-[state=active]:bg-transparent data-[state=active]:text-foreground",
                      "dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent dark:data-[state=active]:text-foreground",
                      "border-transparent data-[state=active]:border-transparent shadow-none data-[state=active]:shadow-none after:hidden",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="relative flex items-center gap-2 px-4 py-3 rounded-md z-10">
                      {isHovered && (
                        <motion.span
                          layoutId="default-link-tab-hover"
                          className="absolute inset-0 bg-muted/70 rounded-md pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="size-4 relative z-10" aria-hidden="true" />
                      <span className="relative z-10">{tab.label}</span>
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="default-link-tab-indicator"
                        className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Slide-animated content panels */}
            <div className="mt-4 relative overflow-hidden">
              <AnimatePresence mode="wait" custom={defaultTabDir}>
                {defaultTabItems.map((tab) => {
                  if (tab.id !== activeDefaultTab) return null
                  const t = tab.id
                  const tAccent = slotAccent[t]
                  const tName = t === "BIBLE" ? "Bible Reading" : t === "PRAYER" ? "Prayer Watch" : "Praise & Worship"
                  const currentDef = defaultLinks[t]
                  const inputVal = defaultInputs[t]
                  const isSavingThis = savingDefaultType === t

                  return (
                    <motion.div
                      key={t}
                      custom={defaultTabDir}
                      variants={reduceMotion ? undefined : tabSlideVariants}
                      initial={reduceMotion ? false : "enter"}
                      animate="center"
                      exit={reduceMotion ? undefined : "exit"}
                      transition={tabSlideTransition}
                    >
                      <div
                        className={cn(
                          "flex w-full flex-col justify-between rounded-xl border p-4 shadow-2xs space-y-3 transition-colors",
                          tAccent.rail,
                          "bg-card/50"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={cn("border-0 font-medium", tAccent.tabFill, tAccent.text)}>
                              {tName}
                            </Badge>
                            {currentDef && (
                              <Badge className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                                Active Default
                              </Badge>
                            )}
                          </div>

                          {currentDef && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/30 p-2.5">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{currentDef.label || "Default Room"}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{currentDef.url}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 shrink-0"
                                onClick={() => handleCopy(currentDef.url, `default-${t}`)}
                              >
                                {copied === `default-${t}` ? (
                                  <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                                ) : (
                                  <Copy className="size-3.5" aria-hidden="true" />
                                )}
                              </Button>
                            </div>
                          )}

                          <div className="space-y-2 pt-1 lg:grid lg:grid-cols-1 lg:gap-4 lg:space-y-0">
                            <div className="space-y-1">
                              <Label htmlFor={`def-url-${t}`} className="text-[11px]">Meeting URL</Label>
                              <Input
                                id={`def-url-${t}`}
                                type="url"
                                placeholder="https://zoom.us/j/..."
                                className="h-8 text-xs"
                                value={inputVal.url}
                                onChange={(e) =>
                                  setDefaultInputs((prev) => ({
                                    ...prev,
                                    [t]: { ...prev[t], url: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`def-label-${t}`} className="text-[11px]">Label (optional)</Label>
                              <Input
                                id={`def-label-${t}`}
                                placeholder="e.g. Daily Zoom Room"
                                className="h-8 text-xs"
                                value={inputVal.label}
                                onChange={(e) =>
                                  setDefaultInputs((prev) => ({
                                    ...prev,
                                    [t]: { ...prev[t], label: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <Button
                            size="sm"
                            onClick={() => handleSaveDefault(t)}
                            disabled={isSavingThis || isLoadingDefaults}
                            className={cn("flex-1 h-8 text-xs gap-1.5", tAccent.solid)}
                          >
                            {isSavingThis ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="size-3.5" aria-hidden="true" />
                                Save Default
                              </>
                            )}
                          </Button>
                          {currentDef && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDefault(t)}
                              className="h-8 px-2 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>

        {/* SECTION 2: DATE-SPECIFIC OVERRIDES */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div>
              <h3 className="text-sm tracking-tight">Date-Specific Link Overrides</h3>
              <p className="text-xs text-muted-foreground">
                Set a custom meeting URL for a specific date (overrides default link for that day).
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Row 1: Slot type selector */}
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

            {/* Row 2: Full-width calendar */}
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="w-full rounded-lg border p-1">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="mx-auto w-full rounded-md"
                />
              </div>
            </div>

            {/* Row 3: Meeting URL + Label — side by side on larger screens */}
            <div className="grid grid-cols-1 gap-4">
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
                  placeholder="e.g. Special Marathon Zoom Room"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Action buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
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
                    Save Override
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

            {/* Row 5: Current link status for selected date */}
            <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="mb-0 text-xs">
                  Link for {format(date, "EEEE, MMMM d")}
                </Label>
                <Badge className={cn("border-0 text-xs", accent.tabFill, accent.text)}>
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
                        <Badge className="shrink-0 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
                          Active
                        </Badge>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {currentLink.url}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopy(currentLink.url, "date-override")}
                      aria-label={copied === "date-override" ? "Link copied" : "Copy meeting link"}
                    >
                      {copied === "date-override" ? (
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
                    No specific link override. Default link applies.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
                {deleteTarget?.date === "DEFAULT"
                  ? "This removes the default meeting link for all days. Members won't see a default link unless set."
                  : "This removes the specific meeting link override for this day. The default link (if set) will apply."}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          {deleteTarget && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <Badge className={cn("border-0", slotAccent[deleteTarget.type].solid)}>
                  {deleteTarget.type === "BIBLE"
                    ? "Bible Reading"
                    : deleteTarget.type === "PRAYER"
                      ? "Prayer"
                      : "Praise & Worship"}
                </Badge>
                <span className="text-sm font-medium">
                  {deleteTarget.date === "DEFAULT"
                    ? "Default (All Days)"
                    : format(new Date(`${deleteTarget.date}T00:00:00`), "EEEE, MMMM d")}
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