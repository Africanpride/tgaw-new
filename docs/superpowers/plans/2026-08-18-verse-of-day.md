# Verse of the Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve a daily scripture from a public API, display it as a card after the stat cards on `/overview`, and let users share it to WhatsApp / Facebook / X / Telegram via a dialog that links to a public `/verse/today` page.

**Architecture:** A curated static verse list (`lib/data/verses.ts`) + a pure `getVerseOfDay(date?)` resolver (`lib/services/verseService.ts`) that picks deterministically by UTC day-of-year. The public API route wraps the resolver; the overview card and the public `/verse/today` page both read the resolver directly (server-side, no client fetch). Sharing uses standard platform share-intent URLs opening in a new tab.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, shadcn/ui (`Card`, `Badge`, `Button`, `Dialog`), `lucide-react`, `sonner`, Bun (`bun`, `bun run`, `bun test`).

## Global Constraints

- Package manager is **Bun** — use `bun add`, `bun run`, `bunx`, never npm.
- TypeScript `strict: true`; no `any` (repo eslint enforces `no-explicit-any`).
- API responses use the envelope `{ "success": true, "data": ... }` / `{ "success": false, "error": ... }`.
- Public API routes live under `app/api/v1/**`.
- shadcn/ui semantic tokens only (`bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-muted`, `bg-primary`) — never ad-hoc hex colors.
- Every Lucide icon / inline `<svg>` needs `aria-hidden="true"`.
- Every `<Link>` must include `className="cursor-pointer"`.
- Dates are computed in **UTC** via `new Date().toISOString().split("T")[0]` (consistent with the app's slot/date handling).
- App base URL comes from `process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"` (see `lib/auth-client.ts:10`).
- Verify with `bun run typecheck` (`tsc --noEmit`) and `bunx eslint <changed files>` after each task; repo-wide lint has pre-existing errors — only require clean output on files this plan touches.
- Use shadcn primitives already present in `components/ui/` (dialog.tsx, card.tsx, badge.tsx, button.tsx) — do NOT run `shadcn add`; they exist.

---

### Task 1: Curated verse list

**Files:**
- Create: `lib/data/verses.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `interface Verse { text: string; reference: string }` and `export const VERSES: Verse[]` (ordered array, first entry = Jan 1)

- [ ] **Step 1: Create `lib/data/verses.ts`**

```ts
export interface Verse {
  text: string
  reference: string
}

export const VERSES: Verse[] = [
  { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  { text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", reference: "John 3:16" },
  { text: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
  { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", reference: "Joshua 1:9" },
  { text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness.", reference: "Galatians 5:22" },
  { text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", reference: "Romans 8:28" },
  { text: "Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.", reference: "1 Thessalonians 5:16-18" },
  { text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", reference: "Jeremiah 29:11" },
  { text: "Therefore encourage one another and build one another up, just as you are doing.", reference: "1 Thessalonians 5:11" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
  { text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.", reference: "Isaiah 40:31" },
  { text: "Let all that you do be done in love.", reference: "1 Corinthians 16:14" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end.", reference: "Lamentations 3:22" },
  { text: "Draw near to God, and he will draw near to you.", reference: "James 4:8" },
  { text: "Whatever you do, work heartily, as for the Lord and not for men.", reference: "Colossians 3:23" },
  { text: "Your word is a lamp to my feet and a light to my path.", reference: "Psalm 119:105" },
  { text: "And whatever you ask in prayer, you will receive, if you have faith.", reference: "Matthew 21:22" },
  { text: "In all your ways acknowledge him, and he will make straight your paths.", reference: "Proverbs 3:6" },
  { text: "For where two or three are gathered in my name, there am I among them.", reference: "Matthew 18:20" },
]
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add lib/data/verses.ts
git commit -m "feat(verse): add curated verse of the day list"
```

---

### Task 2: `getVerseOfDay` resolver

**Files:**
- Create: `lib/services/verseService.ts`
- Test: `lib/services/verseService.test.ts`

**Interfaces:**
- Consumes: `VERSES`, `Verse` from `@/lib/data/verses`
- Produces: `interface VerseOfDay extends Verse { date: string; dayOfYear: number }` and `export function getVerseOfDay(dateStr?: string): VerseOfDay`
  - `dateStr` format `YYYY-MM-DD`; defaults to today's UTC date.
  - `dayOfYear` is 1-indexed (Jan 1 = 1); `verse = VERSES[(dayOfYear - 1) % VERSES.length]`.
  - Behavior: same date → same verse; Jan 1 → `VERSES[0]`; leap-day year math correct (Feb 29 counts as day 60).

- [ ] **Step 1: Write the failing test**

```ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/services/verseService.test.ts`
Expected: FAIL — `Cannot find module "./verseService"` / function not defined

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/services/verseService.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint lib/services/verseService.ts lib/services/verseService.test.ts lib/data/verses.ts`
Expected: PASS, no output/errors

- [ ] **Step 6: Commit**

```bash
git add lib/services/verseService.ts lib/services/verseService.test.ts
git commit -m "feat(verse): add deterministic getVerseOfDay resolver"
```

---

### Task 3: Public API route

**Files:**
- Create: `app/api/v1/verse/today/route.ts`

**Interfaces:**
- Consumes: `getVerseOfDay` from `@/lib/services/verseService`
- Produces: `GET /api/v1/verse/today` → `200 { success: true, data: VerseOfDay }`; on unexpected error `500 { success: false, error: string }`

- [ ] **Step 1: Create `app/api/v1/verse/today/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getVerseOfDay } from "@/lib/services/verseService"

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: getVerseOfDay() })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint "app/api/v1/verse/today/route.ts"`
Expected: PASS, no output/errors

- [ ] **Step 3: Manual smoke test**

Run: start the dev server (`bun run dev` in a separate terminal), then:
`curl -s http://localhost:3000/api/v1/verse/today`
Expected: `{"success":true,"data":{"text":"...","reference":"Philippians 4:13","date":"2026-08-18","dayOfYear":230}}` (date/value reflects actual today)

- [ ] **Step 4: Commit**

```bash
git add app/api/v1/verse/today/route.ts
git commit -m "feat(verse): add public GET /api/v1/verse/today endpoint"
```

---

### Task 4: Share dialog (client component)

**Files:**
- Create: `components/verse/VerseShareDialog.tsx`

**Interfaces:**
- Consumes: `Verse` type from `@/lib/data/verses`
- Produces: `export function VerseShareDialog({ verse }: { verse: Verse })` — renders a `Dialog` whose `DialogTrigger` is a "Share" `Button`; opens share intents for WhatsApp, Facebook, X, Telegram, and a Copy action (uses `sonner` toast)
- Share URL: `const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verse/today``
- Share text: `"${verse.text}" — ${verse.reference}`

- [ ] **Step 1: Create `components/verse/VerseShareDialog.tsx`**

```tsx
"use client"

import { Copy, Globe, Hash, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { LucideIcon } from "lucide-react"
import type { Verse } from "@/lib/data/verses"

interface VerseShareDialogProps {
  verse: Verse
}

interface ShareOption {
  label: string
  icon: LucideIcon
  href: (url: string, text: string) => string
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    label: "WhatsApp",
    icon: MessageCircle,
    href: (_url, text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    label: "Facebook",
    icon: Globe,
    href: (url, text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    label: "X (Twitter)",
    icon: Hash,
    href: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: "Telegram",
    icon: Send,
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
]

export function VerseShareDialog({ verse }: VerseShareDialogProps) {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verse/today`
  const shareText = `"${verse.text}" — ${verse.reference}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    toast.success("Verse copied to clipboard")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="size-4" aria-hidden="true" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share this verse</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {SHARE_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              className="justify-start gap-3"
              asChild
            >
              <a
                href={option.href(shareUrl, shareText)}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer"
              >
                <option.icon className="size-4" aria-hidden="true" />
                {option.label}
              </a>
            </Button>
          ))}
          <Button variant="ghost" className="justify-start gap-3" onClick={handleCopy}>
            <Copy className="size-4" aria-hidden="true" />
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

> Note: `option.href(shareUrl, shareText)` — all share options use the same `(url, text)` signature. WhatsApp ignores `url` (it builds a message-only link from `text`); the other three include both. `_url` is intentionally unused on WhatsApp; eslint `no-unused-vars` allows `_`-prefixed params.

> Icons: lucide-react ^1.30 removed brand icons (`Facebook`, `Twitter`). Use generic substitutes that exist in this version: `MessageCircle` (WhatsApp), `Globe` (Facebook), `Hash` (X/Twitter), `Send` (Telegram). `LucideIcon` is imported as a type.

- [ ] **Step 2: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint components/verse/VerseShareDialog.tsx`
Expected: PASS, no output/errors

- [ ] **Step 3: Commit**

```bash
git add components/verse/VerseShareDialog.tsx
git commit -m "feat(verse): add social share dialog"
```

---

### Task 5: VerseCard (server component)

**Files:**
- Create: `components/verse/VerseCard.tsx`

**Interfaces:**
- Consumes: `getVerseOfDay` from `@/lib/services/verseService`, `VerseShareDialog` from `@/components/verse/VerseShareDialog`
- Produces: `export function VerseCard(): Promise<JSX.Element>` — async server component that renders a `Card` with `BookOpen` icon, verse text, `Badge` "Verse of the Day", and the `VerseShareDialog`

- [ ] **Step 1: Create `components/verse/VerseCard.tsx`**

```tsx
import { BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getVerseOfDay } from "@/lib/services/verseService"
import { VerseShareDialog } from "@/components/verse/VerseShareDialog"

export async function VerseCard() {
  const verse = getVerseOfDay()

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-snug text-foreground">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{verse.reference}</span>
            <Badge variant="secondary" className="shrink-0">
              Verse of the Day
            </Badge>
          </p>
        </div>
        <VerseShareDialog verse={{ text: verse.text, reference: verse.reference }} />
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint components/verse/VerseCard.tsx`
Expected: PASS, no output/errors

- [ ] **Step 3: Commit**

```bash
git add components/verse/VerseCard.tsx
git commit -m "feat(verse): add overview verse card"
```

---

### Task 6: Public `/verse/today` page

**Files:**
- Create: `app/(public)/verse/today/page.tsx`

**Interfaces:**
- Consumes: `getVerseOfDay` from `@/lib/services/verseService`, `VerseShareDialog` from `@/components/verse/VerseShareDialog`
- Produces: `app/(public)/verse/today/page.tsx` — a public server component rendering a centered verse hero (landing page layout pattern from `app/page.tsx`: root `flex min-h-screen` + footer)

- [ ] **Step 1: Create the public page**

```tsx
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getVerseOfDay } from "@/lib/services/verseService"
import { VerseShareDialog } from "@/components/verse/VerseShareDialog"

export default function VerseOfTheDayPage() {
  const verse = getVerseOfDay()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <Badge variant="secondary">Verse of the Day</Badge>
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-7" aria-hidden="true" />
        </div>
        <h1 className="max-w-3xl text-3xl leading-snug sm:text-4xl">
          &ldquo;{verse.text}&rdquo;
        </h1>
        <p className="font-medium text-muted-foreground">{verse.reference}</p>
        <VerseShareDialog verse={{ text: verse.text, reference: verse.reference }} />
        <Link href="/" className="cursor-pointer">
          <Button variant="link" className="cursor-pointer">
            Go to The Global Altar Watch
          </Button>
        </Link>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint "app/(public)/verse/today/page.tsx"`
Expected: PASS, no output/errors

- [ ] **Step 3: Manual smoke test**

Run: start dev server, then:
`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/verse/today`
Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/verse/today/page.tsx"
git commit -m "feat(verse): add public /verse/today landing page"
```

---

### Task 7: Mount VerseCard on the overview page

**Files:**
- Modify: `app/(dashboard)/overview/page.tsx:269` (insert `<VerseCard />` between the closing `</div>` of the stat-card grid at line 269 and the `<div className="grid gap-6 lg:grid-cols-3">` at line 271)

**Interfaces:**
- Consumes: `VerseCard` from `@/components/verse/VerseCard`
- Produces: The overview page renders the verse card directly after the stat cards

- [ ] **Step 1: Add the import**

Add at the top of `app/(dashboard)/overview/page.tsx`, after the `AgendaView` import block:

```tsx
import { VerseCard } from "@/components/verse/VerseCard"
```

- [ ] **Step 2: Insert the component**

Replace the boundary between the stat-card grid and the next grid. Currently:

```tsx
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
```

Change to:

```tsx
        />
      </div>

      <VerseCard />

      <div className="grid gap-6 lg:grid-cols-3">
```

- [ ] **Step 3: Typecheck + lint**

Run: `bun run typecheck` and `bunx eslint "app/(dashboard)/overview/page.tsx"`
Expected: PASS, no output/errors

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/overview/page.tsx"
git commit -m "feat(verse): show verse of the day on overview"
```

---

### Task 8: End-to-end verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `bun test`
Expected: PASS (verseService tests)

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Lint the touched files**

Run:
```bash
bunx eslint lib/data/verses.ts lib/services/verseService.ts lib/services/verseService.test.ts app/api/v1/verse/today/route.ts components/verse/VerseShareDialog.tsx components/verse/VerseCard.tsx "app/(public)/verse/today/page.tsx" "app/(dashboard)/overview/page.tsx"
```
Expected: no errors or warnings on these files (repo-wide lint may still show pre-existing issues elsewhere — ignore those)

- [ ] **Step 4: Manual end-to-end smoke test**

1. Start `bun run dev`.
2. Open `http://localhost:3000/overview` (log in as any user) — verse card visible directly after the 4 stat cards.
3. Open `http://localhost:3000/api/v1/verse/today` — returns the envelope with today's verse.
4. Open `http://localhost:3000/verse/today` — standalone centered verse page renders.
5. On either page, click **Share** → dialog lists WhatsApp / Facebook / X (Twitter) / Telegram / Copy; WhatsApp/FB/X/Telegram open share intents in a new tab; Copy shows the sonner toast and places `text + reference + url` on the clipboard.
