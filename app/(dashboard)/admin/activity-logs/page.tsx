"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Ellipsis, Search, Terminal, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type AuditLog = {
  id: string
  actorId: string
  actorRole: string | null
  action: string
  targetType: string
  targetId: string
  createdAt: string
  metadata?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
  expiresAt?: string | null
}

type Level = "all" | "error" | "warn" | "info" | "debug"

const LEVEL_DOT: Record<string, string> = {
  error: "bg-red-500",
  warn: "bg-amber-500",
  info: "bg-blue-500",
  debug: "bg-muted-foreground/40",
}

const LEVEL_BADGE: Record<string, string> = {
  error: "border-red-200 text-red-700 dark:border-red-900/40",
  warn: "border-amber-200 text-amber-700 dark:border-amber-900/40",
  info: "border-blue-200 text-blue-700 dark:border-blue-900/40",
  debug: "border-border text-muted-foreground",
}

function levelForAction(action: string): "error" | "warn" | "info" | "debug" {
  if (["USER_BAN", "USER_DELETE", "SLOT_ADMIN_CANCEL"].includes(action))
    return "error"
  if (
    [
      "USER_ROLE_CHANGE",
      "COORDINATOR_ASSIGN",
      "USER_UNBAN",
      "BOOKING_CONFIG_CHANGE",
      "POST_HIDE",
      "COMMENT_HIDE",
    ].includes(action)
  )
    return "warn"
  if (action.startsWith("AUTH_") && action.includes("FAILURE")) return "warn"
  if (["SLOTS_GENERATE", "PROFILE_UPDATE"].includes(action)) return "debug"
  return "info"
}

function serviceForAction(action: string): string {
  if (action.startsWith("USER_") || action.startsWith("COORDINATOR"))
    return "admin"
  if (
    action.startsWith("SLOT_") ||
    action.startsWith("BOOKING_") ||
    action.startsWith("MEETING_") ||
    action.startsWith("SLOTS_") ||
    action.startsWith("EVENT_")
  )
    return "booking"
  if (
    action.startsWith("POST_") ||
    action.startsWith("COMMENT_") ||
    action.startsWith("REPORT_") ||
    action.startsWith("BROADCAST_")
  )
    return "moderation"
  if (action.startsWith("GROUP_")) return "groups"
  if (action.startsWith("AUTH_") || action === "PROFILE_UPDATE") return "auth"
  return "app"
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  )
}

function titleForLog(log: AuditLog): string {
  const meta = log.metadata as Record<string, unknown> | undefined
  switch (log.action) {
    case "USER_ROLE_CHANGE":
      return `Role changed: ${(meta?.before as string) ?? "member"} → ${(meta?.after as string) ?? log.targetId}`
    case "USER_BAN":
      return `User banned${meta?.reason ? `: ${meta.reason}` : ""}`
    case "COORDINATOR_ASSIGN":
      return `Coordinator timezones updated: ${(meta?.timezones as string[] | undefined)?.join(", ") ?? log.targetId}`
    case "SLOT_ASSIGN":
      return `Slot assigned to ${(meta?.targetUserId as string | undefined)?.slice(0, 8) ?? log.targetId}`
    case "SLOT_ADMIN_CANCEL":
      return `Slot cancelled by admin${meta?.reason ? `: ${meta.reason}` : ""}`
    case "BOOKING_CONFIG_CHANGE":
      return `Booking config changed: ${Object.keys((meta?.after as object | undefined) ?? {}).join(", ") || "limits"}`
    case "MEETING_LINK_UPSERT":
      return `Meeting link upsert: ${(meta?.type as string) ?? ""} ${String(meta?.date ?? "")}`
    case "POST_HIDE":
      return `Post hidden`
    case "REPORT_RESOLVE":
      return `Report resolved`
    case "GROUP_CREATE":
      return `Group created: ${(meta?.name as string) ?? log.targetId}`
    default:
      return log.action.replace(/_/g, " ").toLowerCase()
  }
}

function detailForLog(log: AuditLog): string {
  const meta = log.metadata as Record<string, unknown> | undefined
  if (!meta) return `${log.targetType} ${log.targetId.slice(0, 8)}`
  // Prefer before/after for config
  if (log.action === "BOOKING_CONFIG_CHANGE" && meta.before && meta.after) {
    const b = meta.before as Record<string, unknown>
    const a = meta.after as Record<string, unknown>
    const changes = Object.keys(a)
      .map((k) => `${k}: ${String(b[k] ?? "—")} → ${String(a[k])}`)
      .join(", ")
    return changes || `Config ${log.targetId.slice(0, 8)}`
  }
  if (meta.reason) return String(meta.reason)
  if (meta.url) return String(meta.url)
  if (meta.title) return String(meta.title)
  return `${log.targetType} ${log.targetId.slice(0, 8)} — ${JSON.stringify(meta).slice(0, 80)}`
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null)
  const [search, setSearch] = useState("")
  const [level, setLevel] = useState<Level>("all")
  const [queryLevel, setQueryLevel] = useState<Level>("all")

  async function fetchLogs(opts?: {
    search?: string
    level?: Level
    clear?: boolean
  }) {
    const params = new URLSearchParams({ limit: "30" })
    const s = opts?.search ?? search
    const l = opts?.level ?? queryLevel
    if (s) params.set("search", s)
    if (l && l !== "all") params.set("level", l)
    const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`)
    const json = await res.json()
    if (json.success) setLogs(json.data)
    else toast.error(json.error ?? "Failed to load logs")
  }

  useEffect(() => {
    fetchLogs({ search: "", level: "all" })
  }, [])

  const filtered = useMemo(() => {
    if (!logs) return null
    let out = logs
    if (search) {
      const q = search.toLowerCase()
      out = out.filter((l) =>
        `${l.action} ${l.targetType} ${l.targetId} ${JSON.stringify(l.metadata ?? "")}`
          .toLowerCase()
          .includes(q)
      )
    }
    if (level !== "all") {
      out = out.filter((l) => levelForAction(l.action) === level)
    }
    return out
  }, [logs, search, level])

  const counts = useMemo(() => {
    if (!logs) return { total: 0, errors: 0 }
    return {
      total: logs.length,
      errors: logs.filter((l) => levelForAction(l.action) === "error").length,
    }
  }, [logs])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchLogs({ search, level: queryLevel })
  }

  async function handleExport() {
    if (!logs) return
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported audit logs")
  }

  async function handleClearDebug() {
    // Client-side clear of debug level only (soft)
    if (!logs) return
    const debugIds = logs
      .filter((l) => levelForAction(l.action) === "debug")
      .map((l) => l.id)
    if (debugIds.length === 0) {
      toast.info("No debug logs to clear")
      return
    }
    setLogs((prev) =>
      prev ? prev.filter((l) => levelForAction(l.action) !== "debug") : prev
    )
    toast.success(`Cleared ${debugIds.length} debug logs (view only)`)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <CalendarCheck className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold sm:text-2xl">Activity Logs</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Audit trail for RBAC, bookings, moderation and auth — latest 30.
          </p>
        </div>
        <div className="ml-auto flex gap-2 max-sm:w-full max-sm:pt-1">
          <Link
            href="/admin"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border px-2 text-xs hover:bg-muted max-sm:w-full sm:h-8 sm:px-3"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <section className="max-w-auto mx-auto w-full">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-2 py-3 sm:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-sm font-medium">Application Logs</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {counts.total} entries · {counts.errors} errors
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleClearDebug}
                >
                  Clear Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 border-b px-2 py-2 sm:px-4"
          >
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-8 border-0 bg-transparent pl-8 text-xs shadow-none focus-visible:ring-0"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {(["all", "error", "warn", "info", "debug"] as Level[]).map(
                (l) => (
                  <button
                    key={l}
                    type={level === l ? "button" : "submit"}
                    onClick={() => {
                      if (level !== l) {
                        setLevel(l)
                        setQueryLevel(l)
                        fetchLogs({ level: l, search })
                      }
                    }}
                    className={
                      level === l
                        ? "rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background"
                        : "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    }
                  >
                    {l[0]!.toUpperCase() + l.slice(1)}
                  </button>
                )
              )}
            </div>
          </form>
          <div>
            {filtered === null ? (
              <div className="p-2 text-center text-sm text-muted-foreground sm:p-8">
                Loading logs…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground sm:p-8">
                No logs match.
              </div>
            ) : (
              filtered.map((log) => {
                const lvl = levelForAction(log.action)
                return (
                  <div
                    key={log.id}
                    className="border-b px-2 py-3 transition-colors last:border-b-0 hover:bg-muted/50 sm:px-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${LEVEL_DOT[lvl]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTime(log.createdAt)}
                          </span>
                          <span
                            className={`inline-flex shrink-0 items-center justify-center rounded border px-1.5 py-0 text-[10px] uppercase ${LEVEL_BADGE[lvl]}`}
                          >
                            {lvl}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {serviceForAction(log.action)}
                          </span>
                          <span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">
                            {log.actorRole ?? log.actorId.slice(0, 6)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-medium">
                          {titleForLog(log)}
                        </p>
                        <p className="mt-0.5 line-clamp-1 font-mono text-xs text-muted-foreground">
                          {detailForLog(log)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {log.targetId.slice(0, 8)}
                          </span>
                          <span className="hidden sm:inline">
                            · {log.ip ?? "—"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() =>
                          toast.info(
                            `${log.action} — ${log.targetType} ${log.targetId}`
                          )
                        }
                      >
                        <Ellipsis className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
