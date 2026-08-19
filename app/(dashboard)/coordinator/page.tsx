import { Users, CalendarCheck, Loader, Clock } from "lucide-react"
import { headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { EmptyState } from "@/components/EmptyState"

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

  const [totalSlots, bookedSlots, totalBookings, todayBookings] =
    await Promise.all([
      prisma.slot.count({ where: { date: { gte: today } } }),
      prisma.slot.count({ where: { date: { gte: today }, bookedBy: { not: null } } }),
      prisma.slot.count({ where: { bookedBy: { not: null } } }),
      prisma.slot.count({ where: { date: today, bookedBy: { not: null } } }),
    ])

  const engagement =
    totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users className="size-6 text-primary" aria-hidden="true" />
        <h2 className="text-2xl tracking-tight">Coordinator Dashboard</h2>
      </div>

      {timezones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Timezone Scoped Oversight</CardTitle>
            <CardDescription>
              View and manage devotion & altar schedules across your assigned
              timezone(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Clock}
              title="No timezones assigned yet"
              description="A superadmin will assign your timezone coverage. Metrics will appear here once you have one."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  Assigned Timezones
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
                  Bookings Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{todayBookings}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  devotional slots confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Loader className="size-4 text-muted-foreground" aria-hidden="true" />
                  Slot Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{engagement}%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  of upcoming slots filled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{totalBookings}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  all-time confirmed slots
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timezone Overview</CardTitle>
              <CardDescription>
                You oversee the devotional watch across {timezones.length}{" "}
                {timezones.length === 1 ? "timezone" : "timezones"}.
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