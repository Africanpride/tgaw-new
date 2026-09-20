import { CalendarCheck, Flag, Megaphone, Shield, Users } from "lucide-react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/dashboard/StatCard"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getServerTranslation } from "@/lib/notifications/locale"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/i18n/config"
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

  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const L = (key: string) => getServerTranslation(locale, "admin", key)
  const [
    portalTitle,
    portalDescription,
    activityLogsLabel,
    statsMembers,
    statsPosts,
    statsReports,
    statsBookings,
    slotsTitle,
    slotsDescription,
  ] = await Promise.all([
    L("portal.title"),
    L("portal.description"),
    L("portal.activityLogs"),
    L("stats.members"),
    L("stats.posts"),
    L("stats.reports"),
    L("stats.bookings"),
    L("slots.title"),
    L("slots.description"),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{portalTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {portalDescription}
          </p>
        </div>
        <a href="/admin/activity-logs" className="inline-flex h-9 items-center rounded-md bg-primary px-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4">
          {activityLogsLabel}
        </a>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={statsMembers}
          value={totalMembers}
          icon={Users}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title={statsPosts}
          value={totalPosts}
          icon={Megaphone}
          className="border-l-4 border-l-violet-500"
        />
        <StatCard
          title={statsReports}
          value={openReports}
          icon={Flag}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title={statsBookings}
          value={totalBookings}
          icon={CalendarCheck}
          className="border-l-4 border-l-amber-500"
        />
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarCheck className="size-5" aria-hidden="true" />
          {slotsTitle}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {slotsDescription}
        </p>
      </div>

      <div className="grid items-start gap-2 md:grid-cols-2 xl:grid-cols-3">
        <AdminBookingConfig initialConfig={bookingConfig} />
        <AdminMeetingLinkManager />
        <div className="md:col-span-2 xl:col-span-1">
          <AdminSlotOverride />
        </div>
      </div>
    </div>
  )
}