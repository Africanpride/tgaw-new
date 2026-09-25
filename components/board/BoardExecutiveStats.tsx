"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  BarChart3,
  UserPlus,
  BookOpen,
  HandHeart,
  Music,
  Megaphone,
  ShieldCheck,
  Activity,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Range = "week" | "month"

interface SlotFill {
  filled: number
  total: number
  rate: number
  previousRate: number
  change: number
}

interface BoardStatsData {
  range: string
  memberGrowth: {
    current: number
    previous: number
    total: number
    change: number
  }
  slotFillRate: { bible: SlotFill; prayer: SlotFill; worship: SlotFill }
  communityActivity: { current: number; previous: number; change: number }
  moderationHealth: {
    open: number
    resolved: number
    total: number
    resolutionRate: number
    previousResolutionRate: number
    change: number
  }
  activeUsers: {
    current: number
    total: number
    rate: number
    previousRate: number
    change: number
  }
  messagesSent: { current: number; previous: number; change: number }
}

function TrendBadge({ change, label }: { change: number; label?: string }) {
  const positive = change >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      )}
    >
      {positive ? (
        <TrendingUp className="size-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3" aria-hidden="true" />
      )}
      {positive ? "+" : ""}
      {change}%
      {label && <span className="ml-1 text-muted-foreground">{label}</span>}
    </span>
  )
}

function StatCard({
  titleKey,
  icon: Icon,
  primaryValue,
  progressPct,
  trendChange,
  description,
  className,
}: {
  titleKey: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  primaryValue: string
  progressPct: number
  trendChange: number
  description: string
  className?: string
}) {
  const { t } = useTranslation("admin")
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t(titleKey)}
          </h5>
          <Icon className="size-4 text-muted-foreground" aria-hidden={true} />
        </div>

        <p className="mt-2 text-2xl leading-none font-bold text-foreground tabular-nums">
          {primaryValue}
        </p>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
          <TrendBadge change={trendChange} />
        </div>
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-4" />
            </div>
            <Skeleton className="mt-2 h-7 w-16" />
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
            <div className="mt-2 flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BoardExecutiveStats() {
  const { t } = useTranslation("admin")
  const [range, setRange] = useState<Range>("week")
  const [data, setData] = useState<BoardStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/admin/board-stats?range=${range}`)
        if (res.ok) {
          const text = await res.text()
          if (text) {
            const json = JSON.parse(text)
            if (!cancelled && json.success) setData(json.data)
          }
        }
      } catch {
        // leave data as-is
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [range])

  return (
    <div className="flex flex-col gap-4">
      {/* Section header + toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold tracking-tight">
            {t("board.stats.title")}
          </h3>
        </div>
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => setRange("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              range === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("board.stats.weekly")}
          </button>
          <button
            onClick={() => setRange("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              range === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("board.stats.monthly")}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("board.stats.description")}
      </p>

      {loading && !data ? (
        <StatsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1 — Member Growth */}
          <StatCard
            titleKey="board.stats.memberGrowth"
            icon={UserPlus}
            primaryValue={`+${data.memberGrowth.current}`}
            progressPct={
              data.memberGrowth.total > 0
                ? (data.memberGrowth.current / data.memberGrowth.total) * 100
                : 0
            }
            trendChange={data.memberGrowth.change}
            description={t("board.stats.memberGrowthDesc", {
              total: data.memberGrowth.total,
            })}
          />

          {/* 2 — Bible Fill Rate */}
          <StatCard
            titleKey="board.stats.bibleFillRate"
            icon={BookOpen}
            primaryValue={`${data.slotFillRate.bible.rate}%`}
            progressPct={data.slotFillRate.bible.rate}
            trendChange={data.slotFillRate.bible.change}
            description={t("board.stats.fillRateDesc", {
              filled: data.slotFillRate.bible.filled,
              total: data.slotFillRate.bible.total,
            })}
          />

          {/* 3 — Prayer Fill Rate */}
          <StatCard
            titleKey="board.stats.prayerFillRate"
            icon={HandHeart}
            primaryValue={`${data.slotFillRate.prayer.rate}%`}
            progressPct={data.slotFillRate.prayer.rate}
            trendChange={data.slotFillRate.prayer.change}
            description={t("board.stats.fillRateDesc", {
              filled: data.slotFillRate.prayer.filled,
              total: data.slotFillRate.prayer.total,
            })}
          />

          {/* 4 — Worship Fill Rate */}
          <StatCard
            titleKey="board.stats.worshipFillRate"
            icon={Music}
            primaryValue={`${data.slotFillRate.worship.rate}%`}
            progressPct={data.slotFillRate.worship.rate}
            trendChange={data.slotFillRate.worship.change}
            description={t("board.stats.fillRateDesc", {
              filled: data.slotFillRate.worship.filled,
              total: data.slotFillRate.worship.total,
            })}
          />

          {/* 5 — Community Posts */}
          <StatCard
            titleKey="board.stats.communityPosts"
            icon={Megaphone}
            primaryValue={String(data.communityActivity.current)}
            progressPct={
              data.communityActivity.previous > 0
                ? (data.communityActivity.current /
                    data.communityActivity.previous) *
                  100
                : data.communityActivity.current > 0
                  ? 100
                  : 0
            }
            trendChange={data.communityActivity.change}
            description={t("board.stats.communityPostsDesc")}
          />

          {/* 6 — Moderation Health */}
          <StatCard
            titleKey="board.stats.moderationHealth"
            icon={ShieldCheck}
            primaryValue={`${data.moderationHealth.resolutionRate}%`}
            progressPct={data.moderationHealth.resolutionRate}
            trendChange={data.moderationHealth.change}
            description={t("board.stats.moderationDesc", {
              resolved: data.moderationHealth.resolved,
              total: data.moderationHealth.total,
            })}
          />

          {/* 7 — Active Users */}
          <StatCard
            titleKey="board.stats.activeUsers"
            icon={Activity}
            primaryValue={String(data.activeUsers.current)}
            progressPct={data.activeUsers.rate}
            trendChange={data.activeUsers.change}
            description={t("board.stats.activeUsersDesc", {
              active: data.activeUsers.current,
              total: data.activeUsers.total,
            })}
          />

          {/* 8 — Messages Sent */}
          <StatCard
            titleKey="board.stats.messagesSent"
            icon={MessageSquare}
            primaryValue={String(data.messagesSent.current)}
            progressPct={
              data.messagesSent.previous > 0
                ? (data.messagesSent.current / data.messagesSent.previous) * 100
                : data.messagesSent.current > 0
                  ? 100
                  : 0
            }
            trendChange={data.messagesSent.change}
            description={t("board.stats.messagesDesc")}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("board.stats.noData")}
        </p>
      )}
    </div>
  )
}
