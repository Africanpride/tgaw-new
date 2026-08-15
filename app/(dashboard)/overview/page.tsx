import { BookOpen, CalendarPlus, Clock, Flame, MessageSquare, Timer } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/dashboard/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { UpcomingBookings } from "@/components/booking/UpcomingBookings"

export default async function OverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const user = session.user
  const today = new Date().toISOString().split("T")[0]

  const upcomingBookings = await prisma.eventBooking.findMany({
    where: {
      userId: user.id!,
      status: "CONFIRMED",
      event: { date: { gte: today } },
    },
    include: { event: true },
    orderBy: [{ event: { date: "asc" } }, { event: { time: "asc" } }],
  })

  const todayBookings = upcomingBookings.filter(
    (booking) => booking.event.date === today,
  )

  const sessionCount = todayBookings.length

  const hour = new Date().getHours()
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : hour >= 17 && hour < 22
          ? "Good evening"
          : "Good night"

  const firstName = user.name?.split(" ")[0] || "there"

  const typeColors: Record<string, string> = {
    BIBLE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    PRAYER: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    PRAISE_WORSHIP:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {sessionCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              &middot;{" "}
              <Badge variant="secondary" className="text-xs">
                {sessionCount} session{sessionCount !== 1 ? "s" : ""} today
              </Badge>
            </span>
          )}
        </p>
      </div>
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				title="Day Streak"
				value={0}
				description="Keep it going!"
				icon={Flame}
				className="border-l-4 border-l-orange-500"
			/>
			<StatCard
				title="Chapters Read"
				value="—"
				description="This month"
				icon={BookOpen}
				className="border-l-4 border-l-purple-500"
			/>
			<StatCard
				title="Prayer Sessions"
				value="—"
				description="This month"
				icon={Timer}
				className="border-l-4 border-l-red-500"
			/>
			<StatCard
				title="Total Time"
				value="—"
				description="Hours invested"
				icon={Clock}
				className="border-l-4 border-l-blue-500"
			/>
		</div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions scheduled today.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {booking.event.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {booking.event.time} &middot; {booking.event.duration}
                        min
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${typeColors[booking.event.type] ?? ""}`}
                    >
                      {booking.event.type.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
			<Button variant="outline" className="mt-4 gap-2">
				<CalendarPlus className="size-4" />
				<Link href="/booking" className="cursor-pointer">
					Book a Slot
				</Link>
			</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Bible Reading Plan</span>
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Prayer Goal</span>
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <UpcomingBookings bookings={upcomingBookings} />

		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MessageSquare className="size-5" />
					Recent Messages
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					No recent messages.{" "}
					<Link
						href="/messages"
						className="cursor-pointer text-primary hover:underline"
					>
						View Messages
					</Link>
				</p>
			</CardContent>
		</Card>
    </div>
  )
}
