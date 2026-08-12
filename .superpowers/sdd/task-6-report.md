# Task 6: Onboarding Route Group Layout and Setup Page

## Status: DONE

## What I Did

Created two files for the onboarding route group:

1. **`app/(onboarding)/layout.tsx`** — Minimal passthrough layout that wraps children in a React fragment. The `OnboardingFlow` component handles its own full-screen layout.

2. **`app/(onboarding)/setup/page.tsx`** — Client component that:
   - Renders the `OnboardingFlow` wizard
   - On completion, POSTs form values to `/api/v1/profile`
   - On success, redirects to `/overview`

## Commit

- `400edc8` — `feat: add onboarding setup page and route group`

## Typecheck

- Ran `bun run typecheck`
- No errors in the new onboarding files
- Pre-existing errors exist in `lib/incoming/onboardingSchema.ts` (Zod v4 API mismatch) — unrelated to this task

## Concerns

- The `/api/v1/profile` endpoint (Task 7) does not exist yet. The setup page will silently fail on the POST call until that endpoint is created. This is expected — Task 7 should create it.
- Pre-existing type errors in `lib/incoming/onboardingSchema.ts` should be cleaned up in a separate task (Zod v4 uses `error` instead of `required_error`, and enum values must be passed as a record, not an array).