# Task 5 Report: OnboardingFlow Wizard Component

## Status: DONE

## What I Did

Created `components/onboarding/OnboardingFlow.tsx` — a multi-step onboarding wizard with:

- **Cover panel**: Desktop left side with `next/image` background, brand logo using `ShieldCheck` icon
- **Mobile brand bar**: Compact header shown only on mobile (`md:hidden`)
- **Stepper**: Desktop shows numbered circles with connecting lines; mobile shows progress bar with step counter
- **5 steps**: NameStep, ContactStep, AboutStep, TimezoneStep, CompleteStep
- **Form validation**: `useForm` with `zodResolver(onboardingSchema)`, per-step `form.trigger()` validation
- **Navigation**: Back/Next buttons with chevron icons, "Finish" on last content step

## Fixes Applied (vs Reference)

1. **Fixed all implicit `any` types**: Changed `form: any` to `form: UseFormReturn<OnboardingValues>` on all step components (NameStep, ContactStep, AboutStep, TimezoneStep)
2. **Fixed `string | null` type errors**: `@base-ui/react` Select's `onValueChange` passes `string | null` — added null guards (`v && setValue(...)`) and fallback values (`watch("field") ?? ""`)
3. **Used `message` in Zod schemas**: Schema already uses `message` (from Task 4), not `required_error`
4. **Corrected imports**: All paths point to `@/lib/schemas/onboardingSchema`, not `@/lib/incoming/...`
5. **Added `ShieldCheck` icon**: Used for brand logo in cover panel and mobile bar (replacing the plain `<div>` placeholder)
6. **Added `aria-hidden="true"`** to all decorative icons (Check, ChevronLeft, ChevronRight, ShieldCheck)
7. **Used `next/link`** for the "Go to dashboard" link (replaced raw `<a>` tag)
8. **Extracted `AGE_RANGES` constant** for the age range select options
9. **Removed `as Resolver<OnboardingValues>` cast**: `zodResolver(onboardingSchema)` infers correctly

## Typecheck

`bun run typecheck` passes for our file. The only errors are in `lib/incoming/onboardingSchema.ts` (old reference file using `required_error` instead of `message` — pre-existing, not part of this task).

## Commit

- `14db57a` — `feat: add OnboardingFlow wizard component`

## Concerns

None. The component is complete and type-safe.
