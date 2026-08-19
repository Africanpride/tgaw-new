import { Shield, Users, CalendarCheck, TrendingUp } from "lucide-react"
import { headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { EmptyState } from "@/components/EmptyState"

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Shield className="size-6 text-primary" aria-hidden="true" />
        <h2 className="text-2xl tracking-tight">Board Dashboard</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{memberCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">in the community</p>
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
            <p className="mt-1 text-sm text-muted-foreground">confirmed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
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
              <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalBookings}</p>
            <p className="mt-1 text-sm text-muted-foreground">all-time confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Org-Wide Overview</CardTitle>
          <CardDescription>
            High-level engagement across all global timezones. Leaders manage
            slots, links, and moderation; this view keeps the board informed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Upcoming slots filled</span>
              <span className="text-sm font-medium tabular-nums">
                {bookedSlots} of {totalSlots}
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
                title="No upcoming bookings yet"
                description="Once members start booking devotional slots, engagement will appear here."
                className="py-10"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}