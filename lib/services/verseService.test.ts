import { describe, expect, it } from "bun:test"
import { getVerseOfDay } from "./verseService"
import { VERSES } from "@/lib/data/verses"

describe("getVerseOfDay", () => {
  it("returns the first verse on Jan 1", () => {
    const result = getVerseOfDay("2026-01-01")
    expect(result.reference).toBe(VERSES[0].reference)
    expect(result.text).toBe(VERSES[0].text)
    expect(result.dayOfYear).toBe(1)
  })

  it("is deterministic for the same date", () => {
    const a = getVerseOfDay("2026-08-18")
    const b = getVerseOfDay("2026-08-18")
    expect(a).toEqual(b)
    expect(a.date).toBe("2026-08-18")
  })

  it("counts day-of-year correctly including a leap day", () => {
    // Feb 29 2028 is day 60
    const result = getVerseOfDay("2028-02-29")
    expect(result.dayOfYear).toBe(60)
    expect(result.reference).toBe(VERSES[59 % VERSES.length].reference)
  })

  it("defaults to today's UTC date", () => {
    const today = new Date().toISOString().split("T")[0]
    expect(getVerseOfDay().date).toBe(today)
  })

  it("cycles back through the list across a year boundary", () => {
    // Dec 31 2028 is day 366; 365 % VERSES.length must index the last-entry wrap
    const result = getVerseOfDay("2028-12-31")
    expect(result.dayOfYear).toBe(366)
    expect(result.reference).toBe(VERSES[365 % VERSES.length].reference)
  })
})
