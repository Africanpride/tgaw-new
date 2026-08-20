import { VERSES, type Verse } from "@/lib/data/verses"
import { prisma } from "@/lib/db/prisma"

export const TRANSLATION = "KJV"
export const HELLO_AO_BIBLE_ID = "eng_kjv"

export interface VerseOfDay extends Verse {
  date: string
  dayOfYear: number
  translation: string
}

export interface VerseStore {
  findByDate(date: string): Promise<VerseOfDay | null>
  save(
    date: string,
    data: { text: string; reference: string; translation: string }
  ): Promise<VerseOfDay>
}

export interface VerseFetcher {
  fetchVerse(
    reference: string
  ): Promise<{ text: string; reference: string; translation: string }>
}

export function getDayOfYear(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const start = Date.UTC(year, 0, 1)
  const now = Date.UTC(year, month - 1, day)
  return Math.floor((now - start) / 86400000) + 1
}

export function dateInTimeZone(utcDate: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utcDate)
}

function getTodayStr(): string {
  return dateInTimeZone(new Date(), process.env.TIMEZONE || "UTC")
}

const BOOK_ABBREVIATIONS: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalm: "PSA",
  Psalms: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
}

const BOOK_NAMES_BY_LENGTH = Object.keys(BOOK_ABBREVIATIONS).sort(
  (a, b) => b.length - a.length
)

export interface ParsedReference {
  book: string
  chapter: number
  verseNumbers: number[]
}

export function parseReference(reference: string): ParsedReference | null {
  for (const bookName of BOOK_NAMES_BY_LENGTH) {
    if (!reference.startsWith(bookName)) continue
    const match = reference
      .slice(bookName.length)
      .trim()
      .match(/^(\d+):(\d+)(?:-(\d+))?$/)
    if (!match) continue
    const chapter = Number(match[1])
    const start = Number(match[2])
    const end = match[3] ? Number(match[3]) : start
    const verseNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    return { book: BOOK_ABBREVIATIONS[bookName], chapter, verseNumbers }
  }
  return null
}

export function createHelloAoBibleFetcher(deps: {
  fetchFn?: (url: string | URL, init?: RequestInit) => Promise<Response>
  translationId?: string
}): VerseFetcher {
  const fetchFn = deps.fetchFn ?? fetch
  const translationId = deps.translationId ?? HELLO_AO_BIBLE_ID
  return {
    fetchVerse: async (reference) => {
      const parsed = parseReference(reference)
      if (!parsed) {
        throw new Error(`Unsupported reference: ${reference}`)
      }
      const { book, chapter, verseNumbers } = parsed
      const url = `https://bible.helloao.org/api/${translationId}/${book}/${chapter}.simple.json`
      const res = await fetchFn(url)
      if (!res.ok) {
        throw new Error(
          `Free Use Bible API request failed: ${res.status}`
        )
      }
      const json = (await res.json()) as {
        chapter?: { content?: { type?: string; number?: number; text?: string }[] }
      }
      const verses = (json?.chapter?.content ?? [])
        .filter(
          (c) =>
            c.type === "verse" &&
            typeof c.number === "number" &&
            verseNumbers.includes(c.number) &&
            typeof c.text === "string"
        )
        .map((c) => c.text as string)
      if (verses.length === 0) {
        throw new Error(`Verse not found: ${reference}`)
      }
      return {
        text: verses.join(" "),
        reference,
        translation: TRANSLATION,
      }
    },
  }
}

export const helloAoBibleFetcher = createHelloAoBibleFetcher({})

export const prismaVerseStore: VerseStore = {
  async findByDate(date) {
    const row = await prisma.verseOfDay.findUnique({ where: { date } })
    if (!row) return null
    return {
      date: row.date,
      text: row.text,
      reference: row.reference,
      translation: row.translation,
      dayOfYear: getDayOfYear(row.date),
    }
  },
  async save(date, data) {
    const row = await prisma.verseOfDay.upsert({
      where: { date },
      update: { ...data },
      create: { date, ...data },
    })
    return {
      date: row.date,
      text: row.text,
      reference: row.reference,
      translation: row.translation,
      dayOfYear: getDayOfYear(row.date),
    }
  },
}

export function createVerseService(deps: {
  store: VerseStore
  fetcher: VerseFetcher
}) {
  return {
    async getVerseOfDay(dateStr?: string): Promise<VerseOfDay> {
      const date = dateStr ?? getTodayStr()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(
          `Invalid date format: ${date} (expected YYYY-MM-DD)`
        )
      }
      const dayOfYear = getDayOfYear(date)
      const fallback: Verse = VERSES[(dayOfYear - 1) % VERSES.length]

      let cached: VerseOfDay | null = null
      try {
        cached = await deps.store.findByDate(date)
      } catch (error: unknown) {
        console.warn(
          "[WARN] Failed to read cached verse of day:",
          error instanceof Error ? error.message : String(error)
        )
      }
      if (cached) return cached

      try {
        const fetched = await deps.fetcher.fetchVerse(fallback.reference)
        try {
          await deps.store.save(date, fetched)
        } catch (error: unknown) {
          console.warn(
            "[WARN] Failed to persist verse of day:",
            error instanceof Error ? error.message : String(error)
          )
        }
        return { date, dayOfYear, ...fetched }
      } catch (error: unknown) {
        console.warn(
          "[WARN] Failed to fetch verse of day, using fallback:",
          error instanceof Error ? error.message : String(error)
        )
        return {
          date,
          dayOfYear,
          text: fallback.text,
          reference: fallback.reference,
          translation: TRANSLATION,
        }
      }
    },
  }
}

export const verseService = createVerseService({
  store: prismaVerseStore,
  fetcher: helloAoBibleFetcher,
})

export function getVerseOfDay(dateStr?: string): Promise<VerseOfDay> {
  return verseService.getVerseOfDay(dateStr)
}