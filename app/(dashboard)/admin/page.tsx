import { CalendarCheck, Flag, Megaphone, Shield, Users } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/dashboard/StatCard"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { AdminBookingConfig } from "@/components/booking/AdminBookingConfig"
import { AdminMeetingLinkManager } from "@/components/booking/AdminMeetingLinkManager"
import { AdminSlotOverride } from "@/components/booking/AdminSlotOverride"

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const role = (session.user.role as string) || "member"
  if (!["leader", "superadmin"].includes(role)) redirect("/unauthorized")

  const [totalMembers, totalPosts, openReports, totalBookings, bookingConfig] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.slot.count({ where: { bookedBy: { not: null } } }),
      prisma.bookingConfig.findFirst(),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">
            Manage booking slots, meeting links, and community moderation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={totalMembers}
          icon={Users}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Published Posts"
          value={totalPosts}
          icon={Megaphone}
          className="border-l-4 border-l-violet-500"
        />
        <StatCard
          title="Open Reports"
          value={openReports}
          icon={Flag}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Active Bookings"
          value={totalBookings}
          icon={CalendarCheck}
          className="border-l-4 border-l-amber-500"
        />
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarCheck className="size-5" aria-hidden="true" />
          Slot Management
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure booking rules, meeting links, and slot overrides.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AdminBookingConfig initialConfig={bookingConfig} />
        <AdminMeetingLinkManager />
        <div className="md:col-span-2 xl:col-span-1">
          <AdminSlotOverride />
        </div>
      </div>
    </div>
  )
}
