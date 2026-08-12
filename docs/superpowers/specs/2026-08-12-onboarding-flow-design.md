# Onboarding Flow Design

## Summary

A mandatory, multi-step onboarding wizard that captures profile data from every new user immediately after sign-up or first login. The flow is enforced via route guards — users cannot access any protected dashboard page until onboarding is complete.

## Data Model

### New `UserProfile` model (1:1 with User)

```prisma
model UserProfile {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone             String
  country           String
  sex               String   // "male" | "female"
  ageRange          String   // "under-18" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65-plus"
  timezone          String   // IANA identifier e.g. "Africa/Accra"
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("user_profile")
}
```

### Addition to `User` model

```prisma
onboardingComplete Boolean @default(false)
```

### Name handling

The onboarding form collects `firstName` + `lastName`. On submission, these are merged into the existing `User.name` field as `"firstName lastName"`. No new name columns are added.

## Route Guard Logic (`proxy.ts`)

```
if (session && !session.user.onboardingComplete && !path.startsWith("/setup")) {
  redirect to /setup
}
```

- `/setup` is added to the proxy as a special path (not in PROTECTED_PATHS, but checked separately)
- Auth pages (`/login`, `/signup`) already redirect authenticated users — no change needed there
- The guard fires on every navigation, so refreshing the page or deep-linking still enforces onboarding

## Onboarding Flow (4 steps + completion)

| Step | Fields | Schema |
|------|--------|--------|
| 1 — Name | firstName, lastName | nameStepSchema |
| 2 — Contact | phone, country | contactStepSchema |
| 3 — About You | sex, ageRange | aboutStepSchema |
| 4 — Time Zone | timezone | timezoneStepSchema |
| 5 — Complete | — | Success screen with "Go to dashboard" button |

### Layout

- **Desktop (md+):** Split layout — cover image left (50%), form right (50%)
- **Mobile:** Compact brand bar top, full-width form below
- **Stepper:** Desktop shows numbered circles with connecting lines; mobile shows compact progress bar

### Validation

- Each step validates only its own fields before advancing (via `form.trigger(fields)`)
- Full schema validated on final "Finish" click
- Errors shown inline below each field

## API Route

### `POST /api/v1/profile`

- Auth required (session check)
- Validates body with `onboardingSchema.safeParse()`
- Creates `UserProfile` record
- Updates `User.name` to `"firstName lastName"`
- Sets `User.onboardingComplete = true`
- Returns `{ success: true }`

## Files to Create/Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add UserProfile model, add onboardingComplete to User |
| `lib/schemas/onboardingSchema.ts` | Create — Zod schemas + step definitions + timezone options |
| `components/onboarding/OnboardingFlow.tsx` | Create — multi-step wizard component |
| `components/ui/radio-group.tsx` | Add — shadcn RadioGroup primitive (missing) |
| `app/(onboarding)/layout.tsx` | Create — minimal layout (no sidebar) |
| `app/(onboarding)/setup/page.tsx` | Create — client page calling OnboardingFlow |
| `app/api/v1/profile/route.ts` | Create — POST handler to save profile |
| `proxy.ts` | Modify — add onboarding guard |
| `app/(dashboard)/layout.tsx` | Modify — pass onboardingComplete to session |
| `lib/auth.ts` | Modify — expose onboardingComplete in customSession |
