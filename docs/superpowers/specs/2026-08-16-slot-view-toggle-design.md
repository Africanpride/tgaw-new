# SlotViewToggle Visual Upgrade Specification

## Overview
The `SlotViewToggle` component provides grid vs list view toggling across the slot booking pages (`/booking`, `/bible`, `/prayer`, `/worship`). The current toggle controls had color contrast and hover state conflicts where Radix UI state classes (`data-[state=on]`) conflicted with Tailwind hover classes (`hover:bg-muted/40`), resulting in flickering text colors and unrefined visual aesthetics.

This design upgrades `SlotViewToggle` to an Apple/Linear-inspired **Floating Segmented Control**.

## Key Improvements

### 1. Zero-Flicker Hover & Color Tokens
- **Container**: `bg-muted/60 border border-border/50 p-1 rounded-xl shadow-2xs w-full sm:w-auto inline-flex items-center gap-1`
- **Active Pill (`layoutId="slot-view-pill"`)**: `bg-background text-foreground shadow-xs border border-border/40 rounded-lg`
- **Active Item State**: `data-[state=on]:bg-transparent data-[state=on]:text-foreground data-[state=on]:hover:bg-transparent font-semibold`
- **Inactive Item State**: `text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors`
- **Hover Isolation**: Ensures hovering over an active button maintains full `text-foreground` readability and transparent background over the animated active pill, eliminating background color jitter.

### 2. Micro-Interactions & Animation
- `motion/react` `layoutId` spring layout animation (`stiffness: 400, damping: 30`).
- Fully respects `useReducedMotion()` preferences.
- Accessible focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`.

### 3. File Target
- [components/booking/SlotViewToggle.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/booking/SlotViewToggle.tsx)

## Verification Plan
1. Type checking via `npx tsc --noEmit`.
2. Build verification via `bun run build`.
