import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isWithinInterval,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns"

/** A booked slot reduced to the fields stats need. */
export interface StatSlot {
  date: string // YYYY-MM-DD (UTC)
  type?: string
}

/** Period-over-period percent changes (1 decimal, coordinator-stats formula). */
export interface SlotTrends {
  today: number
  week: number
  prayerMonth: number
  month: number
}

export interface SlotStats {
  weekSessions: number
  monthSessions: number
  monthMinutes: number
  weekByType: Record<string, number>
  monthByType: Record<string, number>
  trends: SlotTrends
}

const SLOT_MINUTES = 60

/** Human duration for slot-derived minutes: 90 → "1h 30m". */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Percent change vs a previous period, matching the coordinator-stats formula:
 * 1-decimal rounding; a zero previous period yields 100 when there is new
 * activity and 0 when there is none.
 */
export function pctChange(current: number, previous: number): number {
  if (previous > 0)
    return Math.round(((current - previous) / previous) * 1000) / 10
  return current > 0 ? 100 : 0
}

/**
 * Honest usage stats derived from booked slots only:
 * calendar week (Monday-start) sessions, calendar-month sessions,
 * derived monthly time at 60 minutes per session, and per-type counts.
 *
 * Trends compare each period against its equal-length predecessor:
 * today vs yesterday, this week vs last week, this month vs last month
 * (sessions and PRAYER sessions separately).
 */
export function computeSlotStats(slots: StatSlot[], today: Date): SlotStats {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const monthStart = startOfMonth(today)
  // Inclusive window ends: Sunday of this week, last day of this month.
  const weekWindowEnd = addDays(weekStart, 6)
  const monthWindowEnd = endOfMonth(today)

  const prevWeekStart = addDays(weekStart, -7)
  const prevWeekEnd = addDays(weekStart, -1)
  const prevMonthStart = addMonths(monthStart, -1)
  const prevMonthEnd = addDays(monthStart, -1)

  const todayStr = format(today, "yyyy-MM-dd")
  const yesterdayStr = format(addDays(today, -1), "yyyy-MM-dd")

  let sessionsToday = 0
  let sessionsYesterday = 0
  let weekSessions = 0
  let monthSessions = 0
  let prevWeekSessions = 0
  let prevMonthSessions = 0
  const weekByType: Record<string, number> = {}
  const monthByType: Record<string, number> = {}
  const prevMonthByType: Record<string, number> = {}

  for (const slot of slots) {
    const date = parse(slot.date, "yyyy-MM-dd", new Date())

    if (slot.date === todayStr) sessionsToday++
    if (slot.date === yesterdayStr) sessionsYesterday++

    if (isWithinInterval(date, { start: weekStart, end: weekWindowEnd })) {
      weekSessions++
      if (slot.type) weekByType[slot.type] = (weekByType[slot.type] ?? 0) + 1
    }
    if (isWithinInterval(date, { start: monthStart, end: monthWindowEnd })) {
      monthSessions++
      if (slot.type) monthByType[slot.type] = (monthByType[slot.type] ?? 0) + 1
    }
    if (isWithinInterval(date, { start: prevWeekStart, end: prevWeekEnd })) {
      prevWeekSessions++
    }
    if (isWithinInterval(date, { start: prevMonthStart, end: prevMonthEnd })) {
      prevMonthSessions++
      if (slot.type)
        prevMonthByType[slot.type] = (prevMonthByType[slot.type] ?? 0) + 1
    }
  }

  return {
    weekSessions,
    monthSessions,
    monthMinutes: monthSessions * SLOT_MINUTES,
    weekByType,
    monthByType,
    trends: {
      today: pctChange(sessionsToday, sessionsYesterday),
      week: pctChange(weekSessions, prevWeekSessions),
      prayerMonth: pctChange(
        monthByType.PRAYER ?? 0,
        prevMonthByType.PRAYER ?? 0
      ),
      month: pctChange(monthSessions, prevMonthSessions),
    },
  }
}

/**
 * The date-string window covering the stat week and month plus the full
 * previous month (needed for the trend comparisons). Extra rows outside the
 * computed windows are ignored by computeSlotStats.
 */
export function statsQueryRange(today: Date): { from: string; to: string } {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const monthStart = startOfMonth(today)
  const rangeStart = addMonths(monthStart, -1)
  const monthEnd = endOfMonth(today)
  const weekEnd = addDays(weekStart, 7)
  const rangeEnd = weekEnd > monthEnd ? weekEnd : monthEnd
  return {
    from: format(rangeStart, "yyyy-MM-dd"),
    to: format(rangeEnd, "yyyy-MM-dd"),
  }
}
