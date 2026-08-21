# Overview & Dialog Honesty Pass — Design

**Date**: 2026-08-21
**Scope**: cancel-dialog polish (`MyDevotionBookings`), honest overview stat tiles,
honest weekly coverage card. Approved: all three.
**Out of scope**: streak/chapter tracking features, notification wiring.

## 1. Cancel dialog

Match the settings-page dialog conventions exactly:

- `AlertDialogCancel` → `buttonVariants({ variant: "outline" })` + `cursor-pointer`, label **Keep booking**
- `AlertDialogAction` → `buttonVariants({ variant: "destructive" })` + `cursor-pointer`, label **Cancel booking**
- Description names the devotion type (via `slotNoun` prop threaded from
  `DevotionPage`) plus the booking's local time range, e.g.
  "Your prayer booking on Fri, Aug 21, 08:00 – 08:30 will be released for another member."

## 2. Overview stat tiles (no fake numbers)

Replace the four placeholder tiles:

| Old | New | Source |
|---|---|---|
| Day Streak `0` | Sessions Today | `todaySlots.length` (already queried) |
| Chapters Read `—` | Sessions This Week | `getUserSlotStats().weekSessions` |
| Prayer Sessions `—` | Prayer Sessions · Month | `monthByType["PRAYER"]` |
| Total Time `—` | Time This Month | derived minutes, formatted |

## 3. Weekly Progress card → Weekly Watch Coverage

The old card showed fabricated 0% bars for plans/goals that don't exist.
Replaced with real coverage: booked slots ÷ weekly capacity
(`maxXPerDay × 7` from `BookingConfig`) per devotion type, one bar each with
the type's accent colour and true percentage.

## Supporting changes

- `computeSlotStats` gains `weekByType` / `monthByType` counts (TDD);
  existing fields unchanged.
- `formatMinutes()` helper (pure, TDD'd) shared by overview + `DevotionPage`
  (replaces local `formatDuration`).
