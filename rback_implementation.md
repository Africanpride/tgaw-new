# Task: Implement/Upgrade RBAC to the Five-Tier Role System

## Scope guardrail — read first

Only touch files directly related to authentication, authorization, and role
assignment. Do NOT modify booking logic, chat/messaging, notifications,
Cloudinary/media handling, the Community Feed's post/comment features, or any
UI unrelated to roles and permissions. If a change would require touching
something outside this scope, stop and flag it instead of proceeding.

## Step 0 — Detect current state

Before changing anything, inspect the existing implementation:

- What values does the `Role` enum (or equivalent) currently have in
  `prisma/schema.prisma`? **Flag it explicitly if any existing value is
  literally `member`** — the new schema uses `member` as the renamed default
  role, and a naming collision with an old role of the same name needs to be
  resolved deliberately, not silently overwritten.
- What does `lib/auth.ts`'s Better Auth `admin` plugin config currently set
  for `defaultRole` and `adminRole`?
- What role checks currently exist in `proxy.ts` (or `middleware.ts`, if
  that's what this codebase actually uses)?
  Report what you find before making changes, so it's clear what's being
  migrated from.

## Target: Five-tier role system

Roles, in ascending order of access:

1. **`member`** (default) — every new sign-up starts here, no exceptions.
2. **`coordinator`** — scoped to one or more specific timezones. Needs a
   many-to-many join model (`CoordinatorAssignment`: `userId`, `timezone`,
   unique on the pair) since a coordinator can cover more than one timezone.
   Dashboard/reports are filtered to only their assigned timezone(s).
3. **`board`** — org-wide, read-oriented oversight across _all_
   timezones (aggregate view, not per-timezone drill-down), plus the ability
   to message/broadcast to `leader`s. This is a parallel track, not "above"
   or "below" `leader` — no slot administration, no user administration, no
   external-link permissions.
4. **`leader`** — inherits every `member` capability, plus: user
   administration (ban/unban), report generation, slot administration
   (assigning slots to specific members on their behalf), maintaining external
   links (Zoom URLs, etc.), assigning Watch-Leaders for 3-hour Watches, and
   operational oversight across all timezones.
5. **`superadmin`** — full system access. The ONLY role that can promote a
   user to `coordinator`, `board`, or `leader`.

## Required changes

### 1. Prisma schema

- Update the `Role` enum to exactly: `member`, `coordinator`, `board`,
  `leader`, `superadmin`. Default: `member`.
- Add `CoordinatorAssignment` model as described above.
- Generate and apply the migration (`bunx prisma db push` for MongoDB, or
  the equivalent this project already uses — check existing scripts first).
- If any existing seed data / test users reference old role values (e.g.
  `moderator`, `admin`, or a legacy `member` distinct from the new default —
  confirm which, per Step 0), write a one-off migration script to remap
  them sensibly (old `admin`/top role → `superadmin`, everything else →
  `member`) rather than leaving orphaned enum values in the database.

### 2. Better Auth config (`lib/auth.ts`)

- `defaultRole: "member"`.
- `adminRole: ["superadmin"]` — role escalation (`setRole`) via the Better
  Auth admin plugin must be `superadmin`-exclusive.
- Add a `databaseHooks.user.create.before` hook that auto-assigns
  `role: "superadmin"` to sign-ups whose **verified email** (never display
  name) matches a `SUPERADMIN_EMAILS` allowlist — a comma-separated env var.
  Everyone else gets `role: "member"`.
- Add `SUPERADMIN_EMAILS=""` to `.env.example` with a comment explaining the
  format.

### 3. Route protection (`proxy.ts` or equivalent)

- `superadmin` should pass every RBAC check — verify this short-circuit
  exists and works.
- Role-assignment/User Management routes: `superadmin` only.
- Admin portal (user admin, reports, slot admin, external links,
  Watch-Leader assignment, content moderation if this app has a feed):
  `leader` + `superadmin`.
- A coordinator-only route for their timezone-scoped dashboard: `coordinator`
  - `superadmin`.
- A board-only route for the org-wide dashboard: `board` +
  `superadmin`.
- `leader`'s ban/unban and any moderation actions should be implemented as
  custom app-level routes that check role directly — NOT routed through
  Better Auth's admin plugin, since the plugin's `adminRole` is reserved for
  `superadmin`-exclusive role escalation.

### 4. UI

- Sign-up form: confirm there is no role selector anywhere. Every account is
  created as `member` regardless of input.
- Navigation: conditionally render Coordinator/Board/Admin sections based on
  the signed-in user's role, matching the route guards above.
- Role assignment UI (wherever user management currently lives): update the
  role picker's options to the five new values. If a coordinator is
  assigned, prompt for one or more timezones and write to
  `CoordinatorAssignment`.

### 5. Placeholder pages (if they don't exist yet)

- A coordinator dashboard route and a board dashboard route are
  needed as destinations for the nav links and route guards above. If full
  dashboard content doesn't exist yet, a minimal placeholder page
  (role-gated, "Dashboard content coming soon") is sufficient for this pass
  — do not build out booking/reporting features here, that's a separate task.

## Acceptance checklist

- [ ] Signing up as a non-allowlisted email results in `role: "member"`.
- [ ] Signing up with an email in `SUPERADMIN_EMAILS` results in
      `role: "superadmin"` automatically.
- [ ] A `member` cannot access any `/admin`, coordinator, or board route —
      redirected appropriately.
- [ ] A `leader` can access the admin portal but NOT the role-assignment
      page.
- [ ] Only `superadmin` can change another user's role.
- [ ] A `coordinator` can be assigned to multiple timezones and their
      dashboard route is gated to `coordinator` + `superadmin` only.
- [ ] A `board` member's dashboard route is gated to `board` +
      `superadmin` only.
- [ ] No files outside auth/authorization/role-assignment were modified.
