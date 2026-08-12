# Task 2 Report: Add UserProfile Model and Onboarding Flag

## Status: DONE

## What You Did

Added the `UserProfile` model and `onboardingComplete` flag to the Prisma schema for the TGAW onboarding flow.

### Changes Made:

1. **Added `UserProfile` model** before the `User` model in `prisma/schema.prisma`:
   - Fields: `id`, `userId` (unique), `user` (relation), `phone`, `country`, `sex`, `ageRange`, `timezone`, `createdAt`, `updatedAt`
   - Mapped to MongoDB collection `user_profile`

2. **Updated `User` model** with two new fields after `notificationPrefs`:
   - `onboardingComplete Boolean @default(false)` — tracks whether user has completed onboarding
   - `userProfile UserProfile?` — relation to the new UserProfile model

3. **Applied schema changes** to MongoDB database using `bunx prisma db push`:
   - Created `user_profile` collection
   - Added unique index on `userId`

4. **Regenerated Prisma client** using `bunx prisma generate`

## Commit Hash(es)

- `973cc48` — `feat: add UserProfile model and onboardingComplete flag`

## Any Concerns

- None. The schema changes were applied cleanly and the database is in sync with the Prisma schema.
