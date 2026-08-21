import { addDays, endOfMonth, format, isWithinInterval, parse, startOfMonth, startOfWeek } from "date-fns";

/** A booked slot reduced to the fields stats need. */
export interface StatSlot {
  date: string; // YYYY-MM-DD (UTC)
  type?: string;
}

export interface SlotStats {
  weekSessions: number;
  monthSessions: number;
  monthMinutes: number;
  weekByType: Record<string, number>;
  monthByType: Record<string, number>;
}

const SLOT_MINUTES = 30;

/** Human duration for slot-derived minutes: 90 → "1h 30m". */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Honest usage stats derived from booked slots only:
 * calendar week (Monday-start) sessions, calendar-month sessions,
 * derived monthly time at 30 minutes per session, and per-type counts.
 */
export function computeSlotStats(slots: StatSlot[], today: Date): SlotStats {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);
  const monthStart = startOfMonth(today);
  const monthEnd = addDays(endOfMonth(today), 1);

  let weekSessions = 0;
  let monthSessions = 0;
  const weekByType: Record<string, number> = {};
  const monthByType: Record<string, number> = {};

  for (const slot of slots) {
    const date = parse(slot.date, "yyyy-MM-dd", new Date());
    const inWeek = isWithinInterval(date, { start: weekStart, end: weekEnd });
    const inMonth = isWithinInterval(date, { start: monthStart, end: monthEnd });

    if (inWeek) {
      weekSessions++;
      if (slot.type) weekByType[slot.type] = (weekByType[slot.type] ?? 0) + 1;
    }
    if (inMonth) {
      monthSessions++;
      if (slot.type) monthByType[slot.type] = (monthByType[slot.type] ?? 0) + 1;
    }
  }

  return {
    weekSessions,
    monthSessions,
    monthMinutes: monthSessions * SLOT_MINUTES,
    weekByType,
    monthByType,
  };
}

/** The UTC date-string window that covers both the stat week and month. */
export function statsQueryRange(today: Date): { from: string; to: string } {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const rangeStart = weekStart < startOfMonth(today) ? weekStart : startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const weekEnd = addDays(weekStart, 7);
  const rangeEnd = weekEnd > monthEnd ? weekEnd : monthEnd;
  return {
    from: format(rangeStart, "yyyy-MM-dd"),
    to: format(rangeEnd, "yyyy-MM-dd"),
  };
}
