# EventFormDialog Premium Redesign Specification

## Overview
The `EventFormDialog` component allows leaders and coordinators to schedule new Altar sessions (Bible Reading, Prayer Watch, Praise & Worship). The current implementation uses a basic plain text dialog and standard dropdown select.

This design upgrades `EventFormDialog` to a **Dynamic Category-Accented Modal** with interactive card selection, category-specific visual themes, and structured icon-adorned inputs.

## Key Improvements

### 1. Category-Accented Header & Icon Badge
- Dynamic header accent banner matching the selected `EventType`:
  - **BIBLE**: Purple accent tint (`border-purple-500/30`, `bg-purple-500/10 text-purple-600 dark:text-purple-400`, `<BookOpen/>` icon)
  - **PRAYER**: Red accent tint (`border-red-500/30`, `bg-red-500/10 text-red-600 dark:text-red-400`, `<Flame/>` icon)
  - **PRAISE_WORSHIP**: Amber accent tint (`border-amber-500/30`, `bg-amber-500/10 text-amber-600 dark:text-amber-400`, `<Music/>` icon)
- Dynamic subtitle showing quick context: "Schedule a new Altar watch or community gathering."

### 2. Visual 3-Way Card Type Selector
Replaces the plain `<Select>` dropdown with 3 interactive card buttons:
- Each card features category icon, title, and active border/shadow highlight when selected.
- Smooth keyboard navigation and accessibility focus rings.

### 3. Icon-Adorned Inputs & Structured Form Grid
- **Title Field**: Icon prefix `<Sparkles className="size-4 text-muted-foreground" />`
- **Date & Time Grid**: 2-column layout with `<Calendar/>` and `<Clock/>` icon prefixes.
- **Duration Field**: Number input with `<Timer/>` icon.
- **Passage / Focus Field**: Input with `<BookMarked/>` icon.
- **Meeting Link Field**: Input with `<Video/>` icon.
- **Notes Field**: `<FileText/>` adorned textarea.

### 4. Interactive Action Footer
- Glassmorphic footer container (`border-t bg-muted/30 p-4 flex justify-end gap-3`).
- Submitting state displays loading spinner (`<Loader2 className="animate-spin" />`).
- Primary button styled dynamically according to selected event accent.

### 5. File Target
- [components/calendar/event-form-dialog.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/calendar/event-form-dialog.tsx)

## Verification Plan
1. Type checking via `npx tsc --noEmit`.
2. Build verification via `bun run build`.
