import { describe, expect, it } from "bun:test"
import { VERSES } from "@/lib/data/verses"
import {
  createHelloAoBibleFetcher,
  createVerseService,
  dateInTimeZone,
  getDayOfYear,
  parseReference,
  type VerseFetcher,
  type VerseOfDay,
  type VerseStore,
} from "./verseService"

interface VerseRow {
  date: string
  text: string
  reference: string
  translation: string
}

function makeStore() {
	const rows = new Map<string, VerseRow>()
	const store: VerseStore = {
		findByDate: async (date) => {
			const row = rows.get(date)
			if (!row) return null
			return { ...row, dayOfYear: getDayOfYear(date) }
		},
		save: async (date, data) => {
			const row: VerseOfDay = { date, ...data, dayOfYear: getDayOfYear(date) }
			rows.set(date, { date, ...data })
			return row
		},
	}
	return { store, rows }
}

function makeFetcher() {
	const calls: string[] = []
	const fetcher: VerseFetcher = {
		fetchVerse: async (reference) => {
			calls.push(reference)
			const fallback = VERSES.find((v) => v.reference === reference)
			if (!fallback) throw new Error(`No hardcoded verse for ${reference}`)
			return { text: fallback.text, reference, translation: "KJV" }
		},
	}
	return { fetcher, calls }
}

describe("createVerseService.getVerseOfDay", () => {
	it("returns the cached verse without calling the fetcher", async () => {
		const { store, rows } = makeStore()
		const { fetcher, calls } = makeFetcher()
		rows.set("2026-01-01", {
			date: "2026-01-01",
			text: "Cached text",
			reference: "Philippians 4:13",
			translation: "KJV",
		})
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2026-01-01")

		expect(result.text).toBe("Cached text")
		expect(calls).toHaveLength(0)
	})

	it("fetches and caches a verse on a cache miss", async () => {
		const { store, rows } = makeStore()
		const { fetcher, calls } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2026-01-01")

		expect(calls).toEqual(["Philippians 4:13"])
		expect(result.text).toBe(VERSES[0].text)
		expect(result.translation).toBe("KJV")
		expect(rows.get("2026-01-01")?.text).toBe(VERSES[0].text)
	})

	it("falls back to the hardcoded verse when the fetch fails and no cache exists", async () => {
		const { store, rows } = makeStore()
		const fetcher: VerseFetcher = {
			fetchVerse: async () => {
				throw new Error("API down")
			},
		}
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2026-01-01")

		expect(result.reference).toBe(VERSES[0].reference)
		expect(result.text).toBe(VERSES[0].text)
		expect(rows.size).toBe(0)
	})

	it("falls back to the hardcoded verse when the cache lookup and fetch both fail", async () => {
		const store: VerseStore = {
			findByDate: async () => {
				throw new Error("DB down")
			},
			save: async () => {
				throw new Error("DB down")
			},
		}
		const fetcher: VerseFetcher = {
			fetchVerse: async () => {
				throw new Error("API down")
			},
		}
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2026-01-01")

		expect(result.reference).toBe(VERSES[0].reference)
		expect(result.text).toBe(VERSES[0].text)
	})

	it("returns the fetched verse even when persisting fails", async () => {
		const store: VerseStore = {
			findByDate: async () => null,
			save: async () => {
				throw new Error("DB down")
			},
		}
		const { fetcher } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2026-01-01")

		expect(result.reference).toBe(VERSES[0].reference)
		expect(result.text).toBe(VERSES[0].text)
	})

	it("selects the reference deterministically by day of year", async () => {
		const { store } = makeStore()
		const { fetcher } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		const a = await service.getVerseOfDay("2026-08-18")
		const b = await service.getVerseOfDay("2026-08-18")

		expect(a).toEqual(b)
		expect(a.reference).toBe(
			VERSES[(getDayOfYear("2026-08-18") - 1) % VERSES.length].reference
		)
	})

	it("counts day-of-year correctly including a leap day", async () => {
		const { store } = makeStore()
		const { fetcher } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay("2028-02-29")

		expect(result.dayOfYear).toBe(60)
	})

	it("defaults to today's date in the org timezone", async () => {
		const { store } = makeStore()
		const { fetcher } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		const result = await service.getVerseOfDay()

		const expected = dateInTimeZone(new Date(), process.env.TIMEZONE ?? "UTC")
		expect(result.date).toBe(expected)
	})

	it("rejects an invalid date string", async () => {
		const { store } = makeStore()
		const { fetcher } = makeFetcher()
		const service = createVerseService({ store, fetcher })

		expect(service.getVerseOfDay("not-a-date")).rejects.toThrow(
			"Invalid date format"
		)
	})
})

describe("dateInTimeZone", () => {
	it("returns the calendar date in the given timezone", () => {
		const instant = new Date("2026-01-01T01:00:00.000Z")
		expect(dateInTimeZone(instant, "Africa/Accra")).toBe("2026-01-01")
		expect(dateInTimeZone(instant, "America/New_York")).toBe("2025-12-31")
	})
})

describe("createHelloAoBibleFetcher", () => {
	const chapterPayload = {
		chapter: {
			content: [
				{
					type: "verse",
					number: 13,
					text: "I can do all things through Christ which strengtheneth me.",
					footnotes: [],
				},
				{ type: "verse", number: 16, text: "Rejoice evermore.", footnotes: [] },
				{
					type: "verse",
					number: 17,
					text: "Pray without ceasing.",
					footnotes: [],
				},
				{
					type: "verse",
					number: 18,
					text: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
					footnotes: [],
				},
			],
		},
	}

	it("fetches and extracts a single verse by reference", async () => {
		const fetchFn = async () =>
			new Response(JSON.stringify(chapterPayload), { status: 200 })
		const fetcher = createHelloAoBibleFetcher({ fetchFn })

		const result = await fetcher.fetchVerse("Philippians 4:13")

		expect(result.reference).toBe("Philippians 4:13")
		expect(result.text).toBe(
			"I can do all things through Christ which strengtheneth me."
		)
		expect(result.translation).toBe("KJV")
	})

	it("joins verse text for a reference range", async () => {
		const fetchFn = async () =>
			new Response(JSON.stringify(chapterPayload), { status: 200 })
		const fetcher = createHelloAoBibleFetcher({ fetchFn })

		const result = await fetcher.fetchVerse("1 Thessalonians 5:16-18")

		expect(result.text).toBe(
			"Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you."
		)
	})

	it("requests the correct translation, book, and chapter URL", async () => {
		let calledUrl = ""
		const fetchFn = async (url: string | URL) => {
			calledUrl = String(url)
			return new Response(JSON.stringify(chapterPayload), { status: 200 })
		}
		const fetcher = createHelloAoBibleFetcher({
			fetchFn,
			translationId: "eng_kjv",
		})

		await fetcher.fetchVerse("Philippians 4:13")

		expect(calledUrl).toBe(
			"https://bible.helloao.org/api/eng_kjv/PHP/4.simple.json"
		)
	})

	it("throws when the verse is not in the chapter", async () => {
		const fetchFn = async () =>
			new Response(JSON.stringify(chapterPayload), { status: 200 })
		const fetcher = createHelloAoBibleFetcher({ fetchFn })

		expect(fetcher.fetchVerse("Philippians 4:50")).rejects.toThrow(
			"Verse not found"
		)
	})

	it("throws when the API responds non-OK", async () => {
		const fetchFn = async () => new Response("", { status: 500 })
		const fetcher = createHelloAoBibleFetcher({ fetchFn })

		expect(fetcher.fetchVerse("Philippians 4:13")).rejects.toThrow(
			"Free Use Bible API request failed: 500"
		)
	})

	it("throws on an unsupported reference", async () => {
		const fetcher = createHelloAoBibleFetcher({})

		expect(fetcher.fetchVerse("NotABook 1:1")).rejects.toThrow(
			"Unsupported reference"
		)
	})
})

describe("parseReference", () => {
	it("parses a single verse", () => {
		expect(parseReference("Philippians 4:13")).toEqual({
			book: "PHP",
			chapter: 4,
			verseNumbers: [13],
		})
	})

	it("parses a verse range", () => {
		expect(parseReference("1 Thessalonians 5:16-18")).toEqual({
			book: "1TH",
			chapter: 5,
			verseNumbers: [16, 17, 18],
		})
	})

	it("maps Psalm to the Psalms abbreviation", () => {
		expect(parseReference("Psalm 119:105")).toEqual({
			book: "PSA",
			chapter: 119,
			verseNumbers: [105],
		})
	})

	it("distinguishes 1 John from John", () => {
		expect(parseReference("1 John 4:19")?.book).toBe("1JN")
		expect(parseReference("John 8:12")?.book).toBe("JHN")
	})

	it("returns null for an unsupported book", () => {
		expect(parseReference("NotABook 1:1")).toBeNull()
	})
})
