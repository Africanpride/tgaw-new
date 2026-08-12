# Task 3: Expose onboardingComplete in Session

**Status:** DONE

## What I Did

Updated `lib/auth.ts` to expose `onboardingComplete` in the custom session object.

### Changes

- Added a type assertion for the `user` object to include `onboardingComplete?: boolean`
- Added `onboardingComplete: extendedUser.onboardingComplete ?? false` to the returned user object in the `customSession` callback

### Note on Approach

The plan suggested adding a `select` clause, but the current `customSession` callback doesn't query the database directly — it receives the `user` object from Better Auth. Since `onboardingComplete` is in the Prisma User model (added in Task 2), the field is available on the `user` object at runtime. A type assertion was needed because Better Auth's generated types don't include custom fields.

## Commit

- `4cbab84` — `feat: expose onboardingComplete in session`

## Concerns

- **Pre-existing type errors:** `bun run typecheck` shows errors in `lib/incoming/` files (onboarding flow components). These are unrelated to this task and appear to be from other in-progress work.
