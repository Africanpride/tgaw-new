# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mandatory multi-step onboarding wizard that captures profile data (name, phone, country, sex, age range, timezone) from every new user, enforced via route guards.

**Architecture:** New `UserProfile` model (1:1 with User) stores onboarding data. `onboardingComplete` boolean on User model. `proxy.ts` redirects incomplete users to `/setup`. Onboarding wizard is a client component with 4 validated steps + completion screen. API route saves profile and flips the flag.

**Tech Stack:** Next.js 16, Prisma (MongoDB), Zod, React Hook Form, shadcn/ui (RadioGroup, Select, Input, Label, Button), Tailwind CSS, Lucide icons.

## Global Constraints

- Bun package manager (`bun add`, `bunx prisma`)
- TypeScript strict mode
- shadcn/ui semantic tokens (`bg-background`, `text-foreground`, etc.)
- All `<svg>`/Lucide icons must have `aria-hidden="true"`
- `next/image` for raster media
- No `middleware.ts` — use `proxy.ts`
- Better Auth for session management
- Zod `.safeParse()` for API validation
- MongoDB + Prisma adapter

---

## Task 1: Add RadioGroup shadcn component

**Files:**
- Create: `components/ui/radio-group.tsx`

**Interfaces:** None — standalone UI primitive.

- [ ] **Step 1: Add the RadioGroup component**

```bash
bunx shadcn@latest add radio-group
```

- [ ] **Step 2: Verify it installed correctly**

Check that `components/ui/radio-group.tsx` exists and exports `RadioGroup` and `RadioGroupItem`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/radio-group.tsx
git commit -m "chore: add radio-group shadcn primitive"
```

---

## Task 2: Update Prisma schema — UserProfile model + User flag

**Files:**
- Modify: `prisma/schema.prisma`
- Run: `bunx prisma db push && bunx prisma generate`

**Interfaces:** None — schema only.

- [ ] **Step 1: Add UserProfile model and onboardingComplete field**

Add to `prisma/schema.prisma` before the `User` model:

```prisma
model UserProfile {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone     String
  country   String
  sex       String
  ageRange  String
  timezone  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_profile")
}
```

Add to the `User` model (after `notificationPrefs`):

```prisma
onboardingComplete Boolean @default(false)
userProfile        UserProfile?
```

- [ ] **Step 2: Push schema to database**

```bash
bunx prisma db push
bunx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add UserProfile model and onboardingComplete flag"
```

---

## Task 3: Update Better Auth customSession to expose onboardingComplete

**Files:**
- Modify: `lib/auth.ts`

**Interfaces:** Produces `session.user.onboardingComplete` for downstream use in proxy and dashboard.

- [ ] **Step 1: Add onboardingComplete to customSession**

In `lib/auth.ts`, inside the `customSession` callback, add `onboardingComplete` to the returned user object:

```typescript
customSession: async (session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true, image: true, onboardingComplete: true },
  })
  return {
    user: {
      ...session.user,
      name: user?.name ?? session.user.name,
      role: user?.role ?? session.user.role,
      image: user?.image ?? session.user.image,
      onboardingComplete: user?.onboardingComplete ?? false,
    },
  }
},
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: expose onboardingComplete in session"
```

---

## Task 4: Create onboarding Zod schema

**Files:**
- Create: `lib/schemas/onboardingSchema.ts`

**Interfaces:** Produces `onboardingSchema`, `OnboardingValues` type, `ONBOARDING_STEPS`, `TIMEZONE_OPTIONS`.

- [ ] **Step 1: Create the schema file**

```typescript
import { z } from "zod"

export const nameStepSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
})

export const contactStepSchema = z.object({
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-]+$/, "Digits only, may start with +"),
  country: z.string().min(1, "Select a country"),
})

export const aboutStepSchema = z.object({
  sex: z.enum(["male", "female"], { message: "Select an option" }),
  ageRange: z.enum(
    ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"],
    { message: "Select an age range" }
  ),
})

export const timezoneStepSchema = z.object({
  timezone: z.string().min(1, "Select your time zone"),
})

export const onboardingSchema = nameStepSchema
  .merge(contactStepSchema)
  .merge(aboutStepSchema)
  .merge(timezoneStepSchema)

export type OnboardingValues = z.infer<typeof onboardingSchema>

export const ONBOARDING_STEPS = [
  { id: "name", label: "Your Name", schema: nameStepSchema },
  { id: "contact", label: "Contact", schema: contactStepSchema },
  { id: "about", label: "About You", schema: aboutStepSchema },
  { id: "timezone", label: "Time Zone", schema: timezoneStepSchema },
  { id: "complete", label: "Complete", schema: z.object({}) },
] as const

export const TIMEZONE_OPTIONS = [
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Honolulu" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
  { value: "America/Denver", label: "(GMT-07:00) Denver" },
  { value: "America/Chicago", label: "(GMT-06:00) Chicago" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Africa/Accra", label: "(GMT+00:00) Accra" },
  { value: "Africa/Lagos", label: "(GMT+01:00) Lagos" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Johannesburg" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Kolkata" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
] as const
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/schemas/onboardingSchema.ts
git commit -m "feat: add onboarding Zod schemas and step definitions"
```

---

## Task 5: Create OnboardingFlow component

**Files:**
- Create: `components/onboarding/OnboardingFlow.tsx`

**Interfaces:** Consumes `ONBOARDING_STEPS`, `TIMEZONE_OPTIONS`, `onboardingSchema`, `OnboardingValues` from Task 4. Consumes `RadioGroup`, `RadioGroupItem` from Task 1. Produces a ` onComplete(values: OnboardingValues)` callback.

- [ ] **Step 1: Create the component file**

Create `components/onboarding/OnboardingFlow.tsx` with:
- Split layout (cover image left on desktop, brand bar on mobile)
- Stepper component (desktop: numbered circles + lines, mobile: progress bar)
- 4 step content components: NameStep, ContactStep, AboutStep, TimezoneStep
- CompleteStep with "Go to dashboard" link
- Navigation buttons (Back / Next / Finish)
- Form validation per step via `form.trigger(fields)`

Key implementation details:
- Use `useForm` from react-hook-form with `zodResolver`
- Cover image uses `next/image` with `fill`, `sizes="50vw"`, `priority`
- Brand logo: `ShieldCheck` icon from lucide-react
- All icons use `aria-hidden="true"`
- Use shadcn semantic tokens throughout
- Country list: placeholder array (Ghana, Nigeria, US, UK, South Africa, Kenya, Other)
- Age ranges: under-18, 18-24, 25-34, 35-44, 45-54, 55-64, 65-plus
- Sex options: Male, Female (RadioGroup)
- Timezone: TIMEZONE_OPTIONS from schema

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/OnboardingFlow.tsx
git commit -m "feat: add OnboardingFlow wizard component"
```

---

## Task 6: Create onboarding route group and page

**Files:**
- Create: `app/(onboarding)/layout.tsx`
- Create: `app/(onboarding)/setup/page.tsx`

**Interfaces:** Consumes `OnboardingFlow` from Task 5. Produces `POST /api/v1/profile` call.

- [ ] **Step 1: Create minimal onboarding layout**

```tsx
// app/(onboarding)/layout.tsx
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create the setup page**

```tsx
// app/(onboarding)/setup/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import type { OnboardingValues } from "@/lib/schemas/onboardingSchema"

export default function OnboardingSetupPage() {
  const router = useRouter()

  async function handleComplete(values: OnboardingValues) {
    const res = await fetch("/api/v1/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) return
    router.push("/overview")
  }

  return <OnboardingFlow onComplete={handleComplete} />
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(onboarding)/layout.tsx" "app/(onboarding)/setup/page.tsx"
git commit -m "feat: add onboarding setup page and route group"
```

---

## Task 7: Create API route to save profile

**Files:**
- Create: `app/api/v1/profile/route.ts`

**Interfaces:** Consumes `onboardingSchema` from Task 4. Consumes session from `auth.api.getSession()`. Creates `UserProfile` and updates `User`.

- [ ] **Step 1: Create the API route**

```typescript
// app/api/v1/profile/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { onboardingSchema } from "@/lib/schemas/onboardingSchema"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const validation = onboardingSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )
  }

  const { firstName, lastName, phone, country, sex, ageRange, timezone } =
    validation.data

  await prisma.$transaction([
    prisma.userProfile.create({
      data: {
        userId: session.user.id!,
        phone,
        country,
        sex,
        ageRange,
        timezone,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id! },
      data: {
        name: `${firstName} ${lastName}`,
        onboardingComplete: true,
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/api/v1/profile/route.ts
git commit -m "feat: add POST /api/v1/profile endpoint"
```

---

## Task 8: Update proxy.ts with onboarding guard

**Files:**
- Modify: `proxy.ts`

**Interfaces:** Consumes `session.user.onboardingComplete` from Task 3.

- [ ] **Step 1: Add onboarding guard to proxy**

Add `/setup` to a new `ONBOARDING_PATH` constant, and add the guard after the session check:

```typescript
const ONBOARDING_PATH = "/setup"

// After: if (!session) { redirect to /login }
// Before: const role = ...
// Add:
if (
  !(session.user as any).onboardingComplete &&
  !path.startsWith(ONBOARDING_PATH)
) {
  return NextResponse.redirect(new URL(ONBOARDING_PATH, req.url))
}

// Also skip onboarding redirect if already on /setup
if (path.startsWith(ONBOARDING_PATH)) {
  return NextResponse.next()
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: enforce onboarding via proxy route guard"
```

---

## Task 9: Final verification

**Files:** None — verification only.

- [ ] **Step 1: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 2: Run dev server and test manually**

```bash
bun run dev
```

Verify:
- New user signs up → redirected to `/setup`
- Completing onboarding → redirected to `/overview`
- Direct URL to `/overview` without onboarding → redirects to `/setup`
- Existing users (already onboarded) → normal flow, no redirect

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: onboarding flow complete"
```
