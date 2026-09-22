"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Users,
  BookOpen,
  HandHeart,
  Music,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AdminSlotOverride } from "@/components/booking/AdminSlotOverride"

type Range = "week" | "month"

interface SlotFill {
  filled: number
  total: number
  rate: number
  previousRate: number
  change: number
}

interface CoverageGap {
  date: string
  hour: number
  type: string
  startTime: string
  endTime: string
}

interface RecentActivityItem {
  id: string
  action: "booked" | "cancelled"
  userName: string
  userImage: string | null
  type: string
  date: string
  startTime: string
  endTime: string
  timestamp: string
}

interface UserActivityItem {
  userId: string
  name: string
  image: string | null
  timezone: string
  bookingsThisPeriod: number
  lastBookingDate: string | null
  isActive: boolean
}

interface CoordinatorStatsData {
  range: string
  timezones: string[]
  scopedUserCount: number
  slotFillRate: Record<string, SlotFill>
  bookingsToday: { count: number; previousDayCount: number; change: number }
  engagement: { rate: number; previousRate: number; change: number }
  totalBookings: { current: number; previous: number; change: number }
  coverageGaps: CoverageGap[]
  recentActivity: RecentActivityItem[]
  userActivity: UserActivityItem[]
}

function TrendBadge({ change }: { change: number }) {
  const isPositive = change > 0
  const isNeutral = change === 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        isNeutral
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      )}
    >
      {isNeutral ? null : isPositive ? (
        <ArrowUpRight className="size-3" aria-hidden={true} />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden={true} />
      )}
      {Math.abs(change)}%
    </span>
  )
}

function StatCard({
  titleKey,
  icon: Icon,
  primaryValue,
  secondaryValue,
  trendChange,
  description,
}: {
  titleKey: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  primaryValue: string
  secondaryValue?: string
  trendChange?: number
  description: string
}) {
  const { t } = useTranslation("admin")
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{t(titleKey)}</span>
          <Icon className="size-4 text-muted-foreground" aria-hidden={true} />
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{primaryValue}</p>
        {secondaryValue && (
          <p className="mt-0.5 text-xs text-muted-foreground">{secondaryValue}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground line-clamp-1">{description}</span>
          {trendChange !== undefined && <TrendBadge change={trendChange} />}
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-4" />
              </div>
              <Skeleton className="mt-2 h-7 w-16" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CoverageGaps({ gaps }: { gaps: CoverageGap[] }) {
  const { t } = useTranslation("admin")
  const typeBadgeColor: Record<string, string> = {
    BIBLE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    PRAYER: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    PRAISE_WORSHIP: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
          {t("coordinator.gaps.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("coordinator.gaps.description")}</p>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="size-8 text-emerald-500" aria-hidden="true" />
            <p className="text-sm font-medium">{t("coordinator.gaps.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("coordinator.gaps.emptyDesc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {gaps.map((gap, i) => (
              <div
                key={`${gap.date}-${gap.startTime}-${gap.type}-${i}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{gap.date}</span>
                    <span className="text-xs text-muted-foreground">
                      {gap.startTime}–{gap.endTime}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] font-medium", typeBadgeColor[gap.type] ?? "")}
                  >
                    {gap.type === "PRAISE_WORSHIP" ? "WORSHIP" : gap.type}
                  </Badge>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentActivityFeed({ items }: { items: RecentActivityItem[] }) {
  const { t } = useTranslation("admin")
  const typeBadgeColor: Record<string, string> = {
    BIBLE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    PRAYER: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    PRAISE_WORSHIP: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  }

  function formatTimestamp(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("coordinator.activity.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("coordinator.activity.description")}</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Clock className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">{t("coordinator.activity.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("coordinator.activity.emptyDesc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Avatar className="size-8">
                  <AvatarImage src={item.userImage ?? undefined} alt={item.userName} />
                  <AvatarFallback className="text-xs">
                    {item.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.userName}</span>
                    <Badge
                      variant={item.action === "booked" ? "default" : "destructive"}
                      className="text-[10px] shrink-0"
                    >
                      {item.action === "booked"
                        ? t("coordinator.activity.booked")
                        : t("coordinator.activity.cancelled")}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] shrink-0", typeBadgeColor[item.type] ?? "")}
                    >
                      {item.type === "PRAISE_WORSHIP" ? "WORSHIP" : item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.date} · {item.startTime}–{item.endTime}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UserActivityTable({ users }: { users: UserActivityItem[] }) {
  const { t } = useTranslation("admin")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("coordinator.users.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("coordinator.users.description")}</p>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Users className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">{t("coordinator.users.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("coordinator.users.emptyDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4">{t("coordinator.users.col.name")}</th>
                  <th className="pb-2 pr-4">{t("coordinator.users.col.timezone")}</th>
                  <th className="pb-2 pr-4 text-right">{t("coordinator.users.col.bookings")}</th>
                  <th className="pb-2 pr-4">{t("coordinator.users.col.lastBooking")}</th>
                  <th className="pb-2">{t("coordinator.users.col.status")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.userId}
                    className={cn(
                      "border-b last:border-0",
                      !user.isActive && "bg-amber-50/50 dark:bg-amber-950/20",
                    )}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarImage src={user.image ?? undefined} alt={user.name} />
                          <AvatarFallback className="text-[10px]">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{user.timezone}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{user.bookingsThisPeriod}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                      {user.lastBookingDate ?? t("coordinator.users.never")}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                        )}
                      >
                        {user.isActive ? t("coordinator.users.active") : t("coordinator.users.inactive")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CoordinatorStats({ timezones }: { timezones: string[] }) {
  const { t } = useTranslation("admin")
  const [range, setRange] = useState<Range>("week")
  const [data, setData] = useState<CoordinatorStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/admin/coordinator-stats?range=${range}`)
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
    return () => { cancelled = true }
  }, [range])

  return (
    <div className="flex flex-col gap-4">
      {/* Range toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {timezones.length} timezone{timezones.length !== 1 ? "s" : ""} · {data?.scopedUserCount ?? 0} users
        </p>
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => setRange("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              range === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("coordinator.stats.weekly")}
          </button>
          <button
            onClick={() => setRange("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              range === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("coordinator.stats.monthly")}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <OverviewSkeleton />
      ) : data ? (
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList>
            <TabsTrigger value="overview">{t("coordinator.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="slots">{t("coordinator.tabs.slots")}</TabsTrigger>
            <TabsTrigger value="users">{t("coordinator.tabs.users")}</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Overview ── */}
          <TabsContent value="overview" className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* 1 — Scoped Users */}
              <StatCard
                titleKey="coordinator.stats.scopedUsers"
                icon={Users}
                primaryValue={String(data.scopedUserCount)}
                description={t("coordinator.stats.scopedUsersDesc")}
              />

              {/* 2 — Bible Fill Rate */}
              <StatCard
                titleKey="coordinator.stats.bibleFillRate"
                icon={BookOpen}
                primaryValue={`${data.slotFillRate.bible?.rate ?? 0}%`}
                trendChange={data.slotFillRate.bible?.change}
                description={t("coordinator.stats.fillRateDesc", {
                  filled: data.slotFillRate.bible?.filled ?? 0,
                  total: data.slotFillRate.bible?.total ?? 0,
                })}
              />

              {/* 3 — Prayer Fill Rate */}
              <StatCard
                titleKey="coordinator.stats.prayerFillRate"
                icon={HandHeart}
                primaryValue={`${data.slotFillRate.prayer?.rate ?? 0}%`}
                trendChange={data.slotFillRate.prayer?.change}
                description={t("coordinator.stats.fillRateDesc", {
                  filled: data.slotFillRate.prayer?.filled ?? 0,
                  total: data.slotFillRate.prayer?.total ?? 0,
                })}
              />

              {/* 4 — Worship Fill Rate */}
              <StatCard
                titleKey="coordinator.stats.worshipFillRate"
                icon={Music}
                primaryValue={`${data.slotFillRate.worship?.rate ?? 0}%`}
                trendChange={data.slotFillRate.worship?.change}
                description={t("coordinator.stats.fillRateDesc", {
                  filled: data.slotFillRate.worship?.filled ?? 0,
                  total: data.slotFillRate.worship?.total ?? 0,
                })}
              />

              {/* 5 — Bookings Today */}
              <StatCard
                titleKey="coordinator.stats.bookingsToday"
                icon={CalendarCheck}
                primaryValue={String(data.bookingsToday.count)}
                secondaryValue={`${data.bookingsToday.previousDayCount} yesterday`}
                trendChange={data.bookingsToday.change}
                description={t("coordinator.stats.bookingsTodayDesc")}
              />

              {/* 6 — Total Bookings */}
              <StatCard
                titleKey="coordinator.stats.totalBookings"
                icon={TrendingUp}
                primaryValue={String(data.totalBookings.current)}
                secondaryValue={`${data.totalBookings.previous} previous`}
                trendChange={data.totalBookings.change}
                description={t("coordinator.stats.totalBookingsDesc")}
              />
            </div>

            <CoverageGaps gaps={data.coverageGaps} />
          </TabsContent>

          {/* ── Tab 2: Slots & Activity ── */}
          <TabsContent value="slots">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
              <AdminSlotOverride />
              <RecentActivityFeed items={data.recentActivity} />
            </div>
          </TabsContent>

          {/* ── Tab 3: Users ── */}
          <TabsContent value="users">
            <UserActivityTable users={data.userActivity} />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-sm text-muted-foreground">{t("board.stats.noData")}</p>
      )}
    </div>
  )
}
