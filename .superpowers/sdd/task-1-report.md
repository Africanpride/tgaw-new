# Task 1 Report: Curated verse list

## What I implemented

Created `lib/data/verses.ts` containing:

- `export interface Verse { text: string; reference: string }`
- `export const VERSES: Verse[]` — an ordered array of 20 curated verses (first entry = Jan 1), exactly as specified in the task brief.

The file content matches the brief verbatim (confirmed via diff of the brief's code block against the created file, excluding the markdown code fences).

## Test/verification results

`bun run typecheck` → **PASS** (exit 0, no errors).

## Files changed

- `lib/data/verses.ts` (new, 27 lines)

## Commit

- `8c26e78` feat(verse): add curated verse of the day list

## Self-review findings

- File created exactly as the brief specifies.
- Interface and exported constant names match the interface contract (`Verse`, `VERSES`).
- Typecheck passes with no errors.

## Issues or concerns

None.
