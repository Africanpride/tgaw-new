import { Shield, Users, CalendarCheck, TrendingUp } from "lucide-react"
import { cookies, headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { EmptyState } from "@/components/EmptyState"
import { getServerTranslation } from "@/lib/notifications/locale"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/i18n/config"

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0]
}

export default async function BoardDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const today = toDateKey(new Date())

  const [memberCount, totalSlots, bookedSlots, totalBookings, todayBookings] =
    await Promise.all([
      prisma.user.count({ where: { banned: { not: true } } }),
      prisma.slot.count({ where: { date: { gte: today } } }),
      prisma.slot.count({ where: { date: { gte: today }, bookedBy: { not: null } } }),
      prisma.slot.count({ where: { bookedBy: { not: null } } }),
      prisma.slot.count({ where: { date: today, bookedBy: { not: null } } }),
    ])

  const engagement =
    totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const L = (key: string) => getServerTranslation(locale, "admin", key)
  const [
    pageTitle,
    activeMembers,
    activeMembersDesc,
    bookingsTodayLabel,
    bookingsTodayDesc,
    engagementLabel,
    engagementDesc,
    totalBookingsLabel,
    totalBookingsDesc,
    overviewTitle,
    overviewDesc,
    upcomingFilled,
    ofTotal,
    emptyTitle,
    emptyDesc,
  ] = await Promise.all([
    L("board.title"),
    L("board.activeMembers"),
    L("board.activeMembersDesc"),
    L("board.bookingsToday"),
    L("board.bookingsTodayDesc"),
    L("board.engagement"),
    L("board.engagementDesc"),
    L("board.totalBookings"),
    L("board.totalBookingsDesc"),
    L("board.overviewTitle"),
    L("board.overviewDesc"),
    L("board.upcomingFilled"),
    L("board.ofTotal"),
    L("board.emptyTitle"),
    L("board.emptyDesc"),
  ])
  const ofTotalText = ofTotal
    .replace("{{booked}}", String(bookedSlots))
    .replace("{{total}}", String(totalSlots))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Shield className="size-6 text-primary" aria-hidden="true" />
        <h2 className="text-2xl tracking-tight">{pageTitle}</h2>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              {activeMembers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{memberCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">{activeMembersDesc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              {bookingsTodayLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{todayBookings}</p>
            <p className="mt-1 text-sm text-muted-foreground">{bookingsTodayDesc}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
              {engagementLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{engagement}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {engagementDesc}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              {totalBookingsLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalBookings}</p>
            <p className="mt-1 text-sm text-muted-foreground">{totalBookingsDesc}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{overviewTitle}</CardTitle>
          <CardDescription>
            {overviewDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{upcomingFilled}</span>
              <span className="text-sm font-medium tabular-nums">
                {ofTotalText}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${engagement}%` }}
              />
            </div>
            {bookedSlots === 0 && (
              <EmptyState
                icon={CalendarCheck}
                title={emptyTitle}
                description={emptyDesc}
                className="py-2 sm:py-10"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}