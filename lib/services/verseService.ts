import { VERSES, type Verse } from "@/lib/data/verses"

export interface VerseOfDay extends Verse {
  date: string
  dayOfYear: number
}

function getDayOfYear(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const start = Date.UTC(year, 0, 1)
  const now = Date.UTC(year, month - 1, day)
  return Math.floor((now - start) / 86400000) + 1
}

export function getVerseOfDay(dateStr?: string): VerseOfDay {
  const date = dateStr ?? new Date().toISOString().split("T")[0]
  const dayOfYear = getDayOfYear(date)
  const verse = VERSES[(dayOfYear - 1) % VERSES.length]
  return { ...verse, date, dayOfYear }
}
