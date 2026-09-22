import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { boardStatsQuerySchema } from "@/lib/schemas/boardStatsSchema"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !["board", "leader", "superadmin"].includes(role ?? "")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const raw = Object.fromEntries(searchParams.entries())
  const parsed = boardStatsQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })
  }

  const range = parsed.data.range
  const now = new Date()
  const rangeDays = range === "week" ? 7 : 30

  // Current period boundaries
  const currentEnd = now
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - rangeDays)

  // Previous period boundaries (same duration, immediately before)
  const previousEnd = new Date(currentStart)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - rangeDays)

  // Slot date strings (YYYY-MM-DD format)
  const toDateStr = (d: Date) => d.toISOString().split("T")[0]
  const currentStartStr = toDateStr(currentStart)
  const currentEndStr = toDateStr(currentEnd)
  const previousStartStr = toDateStr(previousStart)
  const previousEndStr = toDateStr(previousEnd)

  // ── Member Growth ──
  const [
    memberGrowthCurrent,
    memberGrowthPrevious,
    totalMembers,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    prisma.user.count({ where: { banned: { not: true } } }),
  ])

  const memberGrowthChange = memberGrowthPrevious > 0
    ? Math.round(((memberGrowthCurrent - memberGrowthPrevious) / memberGrowthPrevious) * 1000) / 10
    : memberGrowthCurrent > 0 ? 100 : 0

  // ── Slot Fill Rate (per type) ──
  const slotTypes = ["BIBLE", "PRAYER", "PRAISE_WORSHIP"] as const

  const slotQueries = slotTypes.flatMap((type) => [
    prisma.slot.count({
      where: { type, date: { gte: currentStartStr, lte: currentEndStr }, bookedBy: { not: null } },
    }),
    prisma.slot.count({
      where: { type, date: { gte: currentStartStr, lte: currentEndStr } },
    }),
    prisma.slot.count({
      where: { type, date: { gte: previousStartStr, lte: previousEndStr }, bookedBy: { not: null } },
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

  // ── Community Activity ──
  const [communityCurrent, communityPrevious] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.post.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
  ])

  const communityChange = communityPrevious > 0
    ? Math.round(((communityCurrent - communityPrevious) / communityPrevious) * 1000) / 10
    : communityCurrent > 0 ? 100 : 0

  // ── Moderation Health ──
  const [openReports, resolvedCurrent, resolvedPrevious] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "RESOLVED", createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.report.count({ where: { status: "RESOLVED", createdAt: { gte: previousStart, lte: previousEnd } } }),
  ])

  const totalCurrentReports = openReports + resolvedCurrent
  const totalPreviousReports = openReports + resolvedPrevious
  const resolutionRate = totalCurrentReports > 0 ? Math.round((resolvedCurrent / totalCurrentReports) * 1000) / 10 : 0
  const previousResolutionRate = totalPreviousReports > 0 ? Math.round((resolvedPrevious / totalPreviousReports) * 1000) / 10 : 0
  const moderationChange = Math.round((resolutionRate - previousResolutionRate) * 10) / 10

  // ── Active Users (unique users who booked slots or posted) ──
  const [slotBookers, postAuthors] = await Promise.all([
    prisma.slot.findMany({
      where: { bookedBy: { not: null }, date: { gte: currentStartStr, lte: currentEndStr } },
      select: { bookedBy: true },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
      select: { authorId: true },
    }),
  ])

  const activeUserIds = new Set([
    ...slotBookers.map((s) => s.bookedBy).filter(Boolean) as string[],
    ...postAuthors.map((p) => p.authorId),
  ])

  // Previous period active users
  const [prevSlotBookers, prevPostAuthors] = await Promise.all([
    prisma.slot.findMany({
      where: { bookedBy: { not: null }, date: { gte: previousStartStr, lte: previousEndStr } },
      select: { bookedBy: true },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
      select: { authorId: true },
    }),
  ])

  const prevActiveUserIds = new Set([
    ...prevSlotBookers.map((s) => s.bookedBy).filter(Boolean) as string[],
    ...prevPostAuthors.map((p) => p.authorId),
  ])

  const activeUsersCurrent = activeUserIds.size
  const activeUsersPrevious = prevActiveUserIds.size
  const activeUsersRate = totalMembers > 0 ? Math.round((activeUsersCurrent / totalMembers) * 1000) / 10 : 0
  const activeUsersPrevRate = totalMembers > 0 ? Math.round((activeUsersPrevious / totalMembers) * 1000) / 10 : 0
  const activeUsersChange = Math.round((activeUsersRate - activeUsersPrevRate) * 10) / 10

  // ── Messages Sent ──
  const [messagesCurrent, messagesPrevious] = await Promise.all([
    prisma.message.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.message.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
  ])

  const messagesChange = messagesPrevious > 0
    ? Math.round(((messagesCurrent - messagesPrevious) / messagesPrevious) * 1000) / 10
    : messagesCurrent > 0 ? 100 : 0

  return NextResponse.json({
    success: true,
    data: {
      range,
      memberGrowth: {
        current: memberGrowthCurrent,
        previous: memberGrowthPrevious,
        total: totalMembers,
        change: memberGrowthChange,
      },
      slotFillRate,
      communityActivity: {
        current: communityCurrent,
        previous: communityPrevious,
        change: communityChange,
      },
      moderationHealth: {
        open: openReports,
        resolved: resolvedCurrent,
        total: totalCurrentReports,
        resolutionRate,
        previousResolutionRate,
        change: moderationChange,
      },
      activeUsers: {
        current: activeUsersCurrent,
        total: totalMembers,
        rate: activeUsersRate,
        previousRate: activeUsersPrevRate,
        change: activeUsersChange,
      },
      messagesSent: {
        current: messagesCurrent,
        previous: messagesPrevious,
        change: messagesChange,
      },
    },
  })
}
