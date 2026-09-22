import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { coordinatorStatsQuerySchema } from "@/lib/schemas/coordinatorStatsSchema"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !["coordinator", "superadmin"].includes(role ?? "")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const raw = Object.fromEntries(searchParams.entries())
  const parsed = coordinatorStatsQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })
  }

  // ── Scope resolution ──
  const isSuperadmin = role === "superadmin"
  const assignments = await prisma.coordinatorAssignment.findMany({
    where: { userId: session.user.id },
  })
  let timezones = assignments.map((a) => a.timezone)

  // Superadmins without explicit coordinator assignments see all global timezones
  if (timezones.length === 0 && isSuperadmin) {
    const allProfiles = await prisma.userProfile.findMany({
      select: { timezone: true },
      where: { timezone: { not: "" } },
    })
    timezones = [...new Set(allProfiles.map((p) => p.timezone).filter(Boolean))]
  }

  if (timezones.length === 0) {
    return NextResponse.json({ success: true, data: { range: parsed.data.range, timezones: [], scopedUserCount: 0, slotFillRate: {}, bookingsToday: { count: 0, previousDayCount: 0, change: 0 }, engagement: { rate: 0, previousRate: 0, change: 0 }, totalBookings: { current: 0, previous: 0, change: 0 }, coverageGaps: [], recentActivity: [], userActivity: [] } })
  }

  const rawProfiles = await prisma.userProfile.findMany({
    where: { timezone: { in: timezones } },
    select: { userId: true, timezone: true },
  })

  // Ensure only valid existing users are included
  const rawUserIds = [...new Set(rawProfiles.map((p) => p.userId))]
  const existingUsers = rawUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: rawUserIds } },
        select: { id: true, name: true, image: true },
      })
    : []
  const validUserMap = new Map(existingUsers.map((u) => [u.id, u]))
  const scopeUserIds = rawProfiles.map((p) => p.userId).filter((id) => validUserMap.has(id))

  const range = parsed.data.range
  const now = new Date()
  const rangeDays = range === "week" ? 7 : 30

  // Current period boundaries
  const currentEnd = now
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - rangeDays)

  // Previous period boundaries
  const previousEnd = new Date(currentStart)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - rangeDays)

  // Slot date strings
  const toDateStr = (d: Date) => d.toISOString().split("T")[0]
  const currentStartStr = toDateStr(currentStart)
  const currentEndStr = toDateStr(currentEnd)
  const previousStartStr = toDateStr(previousStart)
  const previousEndStr = toDateStr(previousEnd)
  const todayStr = toDateStr(now)

  // ── Slot Fill Rate (per type, scoped) ──
  const slotTypes = ["BIBLE", "PRAYER", "PRAISE_WORSHIP"] as const

  const slotQueries = slotTypes.flatMap((type) => [
    prisma.slot.count({
      where: { type, date: { gte: currentStartStr, lte: currentEndStr }, bookedBy: { in: scopeUserIds } },
    }),
    prisma.slot.count({
      where: { type, date: { gte: currentStartStr, lte: currentEndStr } },
    }),
    prisma.slot.count({
      where: { type, date: { gte: previousStartStr, lte: previousEndStr }, bookedBy: { in: scopeUserIds } },
    }),
    prisma.slot.count({
      where: { type, date: { gte: previousStartStr, lte: previousEndStr } },
    }),
  ])

  const slotResults = await Promise.all(slotQueries)

  const slotKeyMap: Record<string, string> = { praise_worship: "worship" }
  const slotFillRate = Object.fromEntries(
    slotTypes.map((type, i) => {
      const base = i * 4
      const curFilled = slotResults[base]
      const curTotal = slotResults[base + 1]
      const prevFilled = slotResults[base + 2]
      const prevTotal = slotResults[base + 3]

      const rate = curTotal > 0 ? Math.round((curFilled / curTotal) * 1000) / 10 : 0
      const previousRate = prevTotal > 0 ? Math.round((prevFilled / prevTotal) * 1000) / 10 : 0
      const change = Math.round((rate - previousRate) * 10) / 10

      const key = slotKeyMap[type.toLowerCase()] ?? type.toLowerCase()
      return [key, { filled: curFilled, total: curTotal, rate, previousRate, change }]
    }),
  )

  // ── Bookings Today ──
  const yesterdayStr = toDateStr(new Date(now.getTime() - 86400000))
  const [bookingsToday, bookingsYesterday] = await Promise.all([
    prisma.slot.count({ where: { date: todayStr, bookedBy: { in: scopeUserIds } } }),
    prisma.slot.count({ where: { date: yesterdayStr, bookedBy: { in: scopeUserIds } } }),
  ])
  const bookingsTodayChange = bookingsYesterday > 0
    ? Math.round(((bookingsToday - bookingsYesterday) / bookingsYesterday) * 1000) / 10
    : bookingsToday > 0 ? 100 : 0

  // ── Engagement (upcoming slots fill rate for scoped users) ──
  const [upcomingFilled, upcomingTotal] = await Promise.all([
    prisma.slot.count({ where: { date: { gte: todayStr }, bookedBy: { in: scopeUserIds } } }),
    prisma.slot.count({ where: { date: { gte: todayStr } } }),
  ])
  const engagementRate = upcomingTotal > 0 ? Math.round((upcomingFilled / upcomingTotal) * 1000) / 10 : 0

  // Previous period engagement
  const prevEngagementStartStr = toDateStr(previousStart)
  const [prevUpcomingFilled, prevUpcomingTotal] = await Promise.all([
    prisma.slot.count({ where: { date: { gte: prevEngagementStartStr, lte: currentStartStr }, bookedBy: { in: scopeUserIds } } }),
    prisma.slot.count({ where: { date: { gte: prevEngagementStartStr, lte: currentStartStr } } }),
  ])
  const prevEngagementRate = prevUpcomingTotal > 0 ? Math.round((prevUpcomingFilled / prevUpcomingTotal) * 1000) / 10 : 0
  const engagementChange = Math.round((engagementRate - prevEngagementRate) * 10) / 10

  // ── Total Bookings ──
  const [totalBookingsCurrent, totalBookingsPrevious] = await Promise.all([
    prisma.slot.count({ where: { date: { gte: currentStartStr, lte: currentEndStr }, bookedBy: { in: scopeUserIds } } }),
    prisma.slot.count({ where: { date: { gte: previousStartStr, lte: previousEndStr }, bookedBy: { in: scopeUserIds } } }),
  ])
  const totalBookingsChange = totalBookingsPrevious > 0
    ? Math.round(((totalBookingsCurrent - totalBookingsPrevious) / totalBookingsPrevious) * 1000) / 10
    : totalBookingsCurrent > 0 ? 100 : 0

  // ── Coverage Gaps (unfilled slots in next 48h) ──
  const twoDaysLater = toDateStr(new Date(now.getTime() + 2 * 86400000))
  const unfilledSlots = await prisma.slot.findMany({
    where: { date: { gte: todayStr, lte: twoDaysLater }, bookedBy: null },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 10,
    select: { date: true, startTime: true, endTime: true, type: true },
  })
  const coverageGaps = unfilledSlots.map((s) => ({
    date: s.date,
    hour: parseInt(s.startTime.split(":")[0], 10),
    type: s.type,
    startTime: s.startTime,
    endTime: s.endTime,
  }))

  // ── Recent Activity (last 15 booking/cancellation actions) ──
  // Query all recently modified slots (not user-scoped) so activity shows
  // even when the original booker was deleted or has no UserProfile.
  const recentSlots = await prisma.slot.findMany({
    where: { updatedAt: { gte: previousStart } },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, type: true, date: true, startTime: true, endTime: true, bookedBy: true, updatedAt: true, createdAt: true },
  })

  const recentUserIds = [...new Set(recentSlots.map((s) => s.bookedBy).filter(Boolean) as string[])]
  const recentUsers = recentUserIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: recentUserIds } }, select: { id: true, name: true, image: true } })
    : []
  const recentUserMap = new Map(recentUsers.map((u) => [u.id, u]))

  const recentActivity = recentSlots.map((s) => {
    const user = s.bookedBy ? recentUserMap.get(s.bookedBy) : null
    const isCancelled = s.bookedBy === null
    return {
      id: s.id,
      action: isCancelled ? ("cancelled" as const) : ("booked" as const),
      userName: user?.name?.trim() || "Community Member",
      userImage: user?.image ?? null,
      type: s.type,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      timestamp: s.updatedAt.toISOString(),
    }
  })

  // ── User Activity (per-user booking counts this period) ──
  const userBookings = await prisma.slot.findMany({
    where: { bookedBy: { in: scopeUserIds }, date: { gte: currentStartStr, lte: currentEndStr } },
    select: { bookedBy: true, date: true },
  })

  const userBookingMap = new Map<string, { count: number; lastDate: string }>()
  for (const ub of userBookings) {
    if (!ub.bookedBy) continue
    const existing = userBookingMap.get(ub.bookedBy)
    if (existing) {
      existing.count++
      if (ub.date > existing.lastDate) existing.lastDate = ub.date
    } else {
      userBookingMap.set(ub.bookedBy, { count: 1, lastDate: ub.date })
    }
  }

  const profileTimezoneMap = new Map(rawProfiles.map((p) => [p.userId, p.timezone]))

  const userActivity = scopeUserIds
    .map((uid) => {
      const bookingInfo = userBookingMap.get(uid)
      const user = validUserMap.get(uid)
      const name = user?.name?.trim() || "Community Member"
      return {
        userId: uid,
        name,
        image: user?.image ?? null,
        timezone: profileTimezoneMap.get(uid) ?? "UTC",
        bookingsThisPeriod: bookingInfo?.count ?? 0,
        lastBookingDate: bookingInfo?.lastDate ?? null,
        isActive: (bookingInfo?.count ?? 0) > 0,
      }
    })
    .sort((a, b) => b.bookingsThisPeriod - a.bookingsThisPeriod)

  return NextResponse.json({
    success: true,
    data: {
      range,
      timezones,
      scopedUserCount: scopeUserIds.length,
      slotFillRate,
      bookingsToday: { count: bookingsToday, previousDayCount: bookingsYesterday, change: bookingsTodayChange },
      engagement: { rate: engagementRate, previousRate: prevEngagementRate, change: engagementChange },
      totalBookings: { current: totalBookingsCurrent, previous: totalBookingsPrevious, change: totalBookingsChange },
      coverageGaps,
      recentActivity,
      userActivity,
    },
  })
}
