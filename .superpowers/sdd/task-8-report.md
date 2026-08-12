# Task 8: Enforce Onboarding via Proxy Route Guard

**Status:** DONE

## What I Did

Updated `proxy.ts` with an onboarding guard that redirects users to `/setup` when their profile is incomplete (`onboardingComplete === false`).

### Changes to `proxy.ts`:

1. **Added `ONBOARDING_PATH` constant** (`/setup`).

2. **Added `isOnboardingPath` check** — allows the `/setup` route to pass through even though it's not in `PROTECTED_PATHS`.

3. **Auth page redirect** — when an authenticated user visits `/login` or `/signup`, they're now redirected to `/setup` if onboarding is incomplete, otherwise to `/overview`.

4. **Onboarding guard** — after the session check, if `session.user.onboardingComplete` is falsy and the user isn't already on `/setup`, they're redirected to `/setup`.

### Flow summary:

| Scenario | Result |
|----------|--------|
| Unauthenticated user on protected route | → `/login` |
| Authenticated user on auth page (onboarding incomplete) | → `/setup` |
| Authenticated user on auth page (onboarding complete) | → `/overview` |
| Authenticated user on protected route (onboarding incomplete) | → `/setup` |
| Authenticated user on protected route (onboarding complete) | → pass |
| Authenticated user on `/setup` (onboarding incomplete) | → pass (can complete onboarding) |

## Commit

- `f897734` — `feat: enforce onboarding via proxy route guard`

## Concerns

- Typecheck has **pre-existing errors** in `lib/incoming/onboardingSchema.ts` (Zod v4 API mismatch with `z.enum()` and `required_error`). These are unrelated to this task.
- `session.user.onboardingComplete` is accessed via `(session.user as any)` — this is safe because Task 3 adds `onboardingComplete` to the `customSession` return type. Once the type augmentation is in place, the `as any` cast can be removed.
