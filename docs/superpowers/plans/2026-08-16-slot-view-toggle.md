# SlotViewToggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `SlotViewToggle` to a floating segmented control with zero-flicker hover states and smooth spring layout animation.

**Architecture:** Refactor `SlotViewToggle.tsx` using shadcn semantic tokens, explicit hover/active state scoping with Radix UI selectors, and `motion/react` layoutId animation.

**Tech Stack:** React 19, Tailwind CSS v4, Radix UI (ToggleGroup), motion/react, Lucide React icons.

## Global Constraints
- Must use shadcn semantic tokens (`bg-muted/60`, `border-border/50`, `bg-background`, `text-foreground`, `text-muted-foreground`).
- Must eliminate hover flickering on active items using `data-[state=on]:bg-transparent` and `data-[state=on]:hover:bg-transparent`.
- Must respect `useReducedMotion()`.

---

### Task 1: Refactor SlotViewToggle Component Visuals

**Files:**
- Modify: `components/booking/SlotViewToggle.tsx`

**Interfaces:**
- Consumes: `SlotViewMode` ("grid" | "list"), `SlotViewToggleProps` (`view`, `onViewChange`)
- Produces: Polished `SlotViewToggle` component.

- [ ] **Step 1: Update SlotViewToggle styling and state scoping**

Replace the contents of `components/booking/SlotViewToggle.tsx` with:

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type SlotViewMode = "grid" | "list";

const options = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
] as const;

interface SlotViewToggleProps {
  view: SlotViewMode;
  onViewChange: (view: SlotViewMode) => void;
  className?: string;
}

export function SlotViewToggle({ view, onViewChange, className }: SlotViewToggleProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(val) => {
        if (val) onViewChange(val as SlotViewMode);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border/50 bg-muted/60 p-1 shadow-2xs w-full sm:w-auto justify-start",
        className
      )}
    >
      {options.map((item) => {
        const isActive = view === item.id;
        return (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            aria-label={`${item.label} view`}
            className="relative h-8 flex-1 cursor-pointer select-none rounded-lg border-0 px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-background/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=on]:bg-transparent! data-[state=on]:text-foreground! data-[state=on]:font-semibold data-[state=on]:hover:bg-transparent! sm:flex-none"
          >
            <div className="relative z-10 flex items-center justify-center gap-1.5">
              <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            {isActive && (
              <motion.div
                layoutId="slot-view-pill"
                initial={reduceMotion ? false : undefined}
                className="absolute inset-0 z-0 rounded-lg border border-border/40 bg-background shadow-xs"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 30 }
                }
              />
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected output: exit status 0 (no errors)

- [ ] **Step 3: Run production build**

Run: `bun run build`
Expected output: successful compilation

- [ ] **Step 4: Commit changes**

```bash
git add components/booking/SlotViewToggle.tsx docs/superpowers/specs/2026-08-16-slot-view-toggle-design.md docs/superpowers/plans/2026-08-16-slot-view-toggle.md
git commit -m "style(booking): upgrade SlotViewToggle to floating segmented control"
```
