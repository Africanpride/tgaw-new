import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const user = session.user
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Day Streak"
          value={0}
          description="Keep it going!"
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Chapters Read"
          value="—"
          description="This month"
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          title="Prayer Sessions"
          value="—"
          description="This month"
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Total Time"
          value="—"
          description="Hours invested"
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
            <p className="text-sm text-muted-foreground">
              No sessions scheduled today.
            </p>
            <Button variant="outline" nativeButton={false} render={<Link href="/booking" className="cursor-pointer" />} className="mt-4 cursor-pointer">
              Book a Slot
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent messages.{" "}
            <Link href="/messages" className="cursor-pointer text-primary hover:underline">
              View Messages
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
