# Default Meeting Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable setting permanent default Zoom/Teams meeting links for Bible Reading, Prayer Watch, and Praise & Worship that apply automatically to all days, while allowing date-specific overrides.

**Architecture:** Update `upsertMeetingLinkSchema` in `lib/schemas/slotSchema.ts` to accept `date: "DEFAULT"`, update `getSlotsForDate` in `lib/services/slotService.ts` to resolve `date: "DEFAULT"` fallbacks, and update `AdminMeetingLinkManager.tsx` to present default link cards alongside date-specific overrides.

**Tech Stack:** React 19, Next.js App Router, Prisma ORM, Zod, Lucide React icons, shadcn UI.

## Global Constraints
- Preserve exact `MeetingLink` schema in Prisma (`date: String`, `@@unique([type, date])`).
- Date-specific link overrides take precedence over `"DEFAULT"` links.
- Maintain RBAC checks (`leader` and `superadmin` only for meeting link mutations).

---

### Task 1: Update Schema & Service Resolution

**Files:**
- Modify: `lib/schemas/slotSchema.ts:38-44`
- Modify: `lib/services/slotService.ts:132-185`

**Interfaces:**
- Consumes: `upsertMeetingLinkSchema`, `getSlotsForDate`
- Produces: Support for `date: "DEFAULT"` and fallback link resolution.

- [ ] **Step 1: Update Zod Schema**

In `lib/schemas/slotSchema.ts`, update `upsertMeetingLinkSchema`:

```ts
export const upsertMeetingLinkSchema = z.object({
  type: slotTypeSchema,
  date: z.string().refine((val) => val === "DEFAULT" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Invalid date format (YYYY-MM-DD or DEFAULT)",
  }),
  url: z.string().url("Must be a valid URL"),
  label: z.string().max(100).optional(),
});
```

- [ ] **Step 2: Update slotService Meeting Link Lookup**

In `lib/services/slotService.ts`, update `getSlotsForDate`:

```ts
  const meetingLinks = await prisma.meetingLink.findMany({
    where: {
      OR: [
        { date },
        { date: "DEFAULT" },
      ],
    },
  });

  const getLinkForType = (t: EventType) => {
    return (
      meetingLinks.find((m) => m.type === t && m.date === date) ||
      meetingLinks.find((m) => m.type === t && m.date === "DEFAULT") ||
      null
    );
  };

  const meetingLinksMap = {
    BIBLE: getLinkForType("BIBLE"),
    PRAYER: getLinkForType("PRAYER"),
    PRAISE_WORSHIP: getLinkForType("PRAISE_WORSHIP"),
  };
```

---

### Task 2: Upgrade Admin Meeting Link Manager UI

**Files:**
- Modify: `components/booking/AdminMeetingLinkManager.tsx`

**Interfaces:**
- Consumes: `/api/v1/slots/meeting-link` (PUT / DELETE / GET)
- Produces: Admin panel to manage Default Links for All Days & Date-Specific Overrides.

- [ ] **Step 1: Update AdminMeetingLinkManager**

Update `components/booking/AdminMeetingLinkManager.tsx` to include dedicated cards for default links for `BIBLE`, `PRAYER`, and `PRAISE_WORSHIP`, as well as date-specific overrides.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected output: exit status 0

- [ ] **Step 3: Run production build**

Run: `bun run build`
Expected output: successful compilation

- [ ] **Step 4: Commit changes**

```bash
git add lib/schemas/slotSchema.ts lib/services/slotService.ts components/booking/AdminMeetingLinkManager.tsx docs/superpowers/specs/2026-08-16-default-meeting-links-design.md docs/superpowers/plans/2026-08-16-default-meeting-links.md
git commit -m "feat(booking): add default Zoom/Teams meeting links for Bible, Prayer, and Worship"
```
