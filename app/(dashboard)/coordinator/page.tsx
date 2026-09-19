import { Users, CalendarCheck, Loader, Clock } from "lucide-react"
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

export default async function CoordinatorDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const today = toDateKey(new Date())
  const assignments = await prisma.coordinatorAssignment.findMany({
    where: { userId: session.user.id },
  })
  const timezones = assignments.map((a) => a.timezone)

  // If coordinator has assigned timezones, scope booking counts to users in those timezones
  let scopeUserIds: string[] | null = null
  if (timezones.length > 0) {
    const usersInScope = await prisma.userProfile.findMany({
      where: { timezone: { in: timezones } },
      select: { userId: true },
    })
    scopeUserIds = usersInScope.map((u) => u.userId)
  }

  const scopedBookedFilter = scopeUserIds
    ? { bookedBy: { in: scopeUserIds } }
    : { bookedBy: { not: null } as const }

  const [totalSlots, bookedSlots, totalBookings, todayBookings] =
    await Promise.all([
      prisma.slot.count({ where: { date: { gte: today } } }),
      prisma.slot.count({ where: { date: { gte: today }, ...scopedBookedFilter } }),
      prisma.slot.count({ where: { ...scopedBookedFilter } }),
      prisma.slot.count({ where: { date: today, ...scopedBookedFilter } }),
    ])

  const engagement =
    totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const L = (key: string) => getServerTranslation(locale, "admin", key)
  const [
    pageTitle,
    emptyCardTitle,
    emptyCardDesc,
    emptyTitle,
    emptyDesc,
    assignedTimezones,
    bookingsToday,
    bookingsTodayDesc,
    engagementLabel,
    engagementDesc,
    totalBookingsLabel,
    totalBookingsDesc,
    overviewTitle,
    overviewOne,
    overviewOther,
  ] = await Promise.all([
    L("coordinator.title"),
    L("coordinator.emptyCardTitle"),
    L("coordinator.emptyCardDesc"),
    L("coordinator.emptyTitle"),
    L("coordinator.emptyDesc"),
    L("coordinator.assignedTimezones"),
    L("coordinator.bookingsToday"),
    L("coordinator.bookingsTodayDesc"),
    L("coordinator.engagement"),
    L("coordinator.engagementDesc"),
    L("coordinator.totalBookings"),
    L("coordinator.totalBookingsDesc"),
    L("coordinator.overviewTitle"),
    L("coordinator.overview_one"),
    L("coordinator.overview_other"),
  ])
  const overviewDesc = (timezones.length === 1 ? overviewOne : overviewOther).replace("{{count}}", String(timezones.length))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users className="size-6 text-primary" aria-hidden="true" />
        <h2 className="text-2xl tracking-tight">{pageTitle}</h2>
      </div>

      {timezones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{emptyCardTitle}</CardTitle>
            <CardDescription>
              {emptyCardDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Clock}
              title={emptyTitle}
              description={emptyDesc}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  {assignedTimezones}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{timezones.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">{timezones.join(", ")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                  {bookingsToday}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{todayBookings}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bookingsTodayDesc}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Loader className="size-4 text-muted-foreground" aria-hidden="true" />
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
                  <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                  {totalBookingsLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{totalBookings}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalBookingsDesc}
                </p>
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
              <div className="flex flex-wrap gap-2">
                {timezones.map((tz) => (
                  <span
                    key={tz}
                    className="rounded-md border bg-muted/40 px-2.5 py-1 text-sm font-medium"
                  >
                    {tz}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}