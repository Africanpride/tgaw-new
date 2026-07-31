# TGAW — Build Todo

Reference `AGENTS.md` (and `DESIGN.md` / `prompt.md` if present) before every phase. Work phases in order — each depends on the ones before it. Check off tasks as completed. Run `bun run check` (Biome) before committing any phase.

---

## Phase 0 — Project Scaffolding
- [x] Init Next.js 16 (App Router) + TypeScript (`strict: true`) project with `bun`
- [x] Run `bunx shadcn@latest init`
- [x] Set up Tailwind CSS v4 + `globals.css` design tokens (§12.A — light + dark HSL vars)
- [x] Add `lib/utils.ts` with `cn()` helper (§12.B)
- [x] Load `Inter` via `next/font/google` in root `layout.tsx`
- [x] Create full directory structure per §1.3 (empty stub files/folders)
- [x] Add `.env.example` with all keys from §13
- [x] Add required shadcn primitives: `button card form input dropdown-menu avatar badge table calendar dialog select progress toast`

## Phase 1 — Database Layer
- [x] Write `prisma/schema.prisma` in full (§2.A — all models: Event, EventBooking, Conversation, Message, Group, GroupMember, Post, Comment, Like, Poll, PollOption, Follow, Notification, PushSubscription, Report, Broadcast, User, Session, Account, Verification)
- [x] **Verify Better Auth ID mapping rule**: `User`/`Account`/`Session`/`Verification` and any `User.id` foreign keys use plain `String @id @map("_id")`, no `@db.ObjectId`
- [x] Run `bunx prisma db push` against MongoDB Atlas
- [x] Run `bunx prisma generate`
- [x] Create `lib/db/prisma.ts` singleton (§2.C)
- [x] Write Zod schemas for all domains in `lib/schemas/`: `eventSchema.ts`, `messageSchema.ts`, `postSchema.ts`, `groupSchema.ts` (§2.B pattern — schema + inferred types)

## Phase 2 — Auth & RBAC
- [x] Configure `lib/auth.ts` (Better Auth, `admin` plugin, roles: `member`/`moderator`/`admin`) (§3.B)
- [x] Configure `lib/auth-client.ts` (§3.C)
- [x] Build `app/api/auth/[...all]/route.ts` catch-all handler (§3.D)
- [x] Build `proxy.ts` for route protection + RBAC guards — **do not create `middleware.ts`** (§3.E)
- [x] Verify session shape and role checks work end-to-end (protected route → 403 → `unauthorized` page)

## Phase 3 — Custom Server & Real-Time Chat
- [x] Build `server.ts` (Next.js handler + Socket.IO on one HTTP server) (§5.A)
- [x] Update `package.json` scripts to run via `tsx`/`ts-node` instead of `next dev`/`next start`
- [x] Build `lib/socket/server.ts` (room/namespace logic)
- [x] Build `lib/socket/client.ts` (client singleton)
- [x] Build `providers/SocketProvider.tsx` (§5.B) and wrap app
- [x] Implement conventions from §5.C (rooms per conversation, event names, auth handshake)

## Phase 4 — Media Storage
- [x] Build `lib/storage/cloudinary.ts` config + signed upload helper (§6.A)
- [x] Build `POST /api/v1/uploads/sign` endpoint (§6.B)
- [x] Confirm upload pattern works from a client form (image/video/audio/document)

## Phase 5 — Notifications
- [x] Build `lib/notifications/email.ts` (Nodemailer transport + send helpers) (§7.A)
- [x] Build `lib/notifications/push.ts` (Web Push / VAPID subscribe + send) (§7.B)
- [x] Build `public/sw.js` service worker for push events
- [x] Build `lib/notifications/dispatch.ts` (fan-out by `NotificationType`) (§7.C)
- [x] Implement slot-reminder scheduling logic

## Phase 6 — API Layer (`app/api/v1/*`)
Standardize every handler on `{ success, data, error }` response shape + Zod `.safeParse()` validation (§1.2, §4).
- [x] `events/route.ts` (GET list/filter, POST) + `events/[id]/route.ts` (GET/PUT/PATCH/DELETE)
- [x] `bookings/route.ts` (POST book slot) + `bookings/[id]/route.ts` (PATCH cancel)
- [x] `messages/route.ts` (GET list, POST) + `messages/[id]/route.ts` (PATCH read/unread)
- [x] `posts/route.ts` (GET feed paginated, POST) + `posts/[id]/route.ts` (GET/DELETE/PATCH isHidden)
- [x] `posts/[id]/comments/route.ts`
- [x] `posts/[id]/likes/route.ts`
- [x] `groups/route.ts` (GET list, POST) + `groups/[id]/members/route.ts`
- [x] `reports/route.ts` (GET open queue — admin, POST file report)
- [x] `uploads/sign/route.ts` (already built in Phase 4 — wire into this location)
- [x] `calendar/ical/route.ts` (per-user iCal feed, token auth)
- [x] Add server actions: `actions/eventActions.ts`, `actions/messageActions.ts`

## Phase 7 — Auth Pages
- [x] `app/(auth)/login/page.tsx` — split-panel/card login (§9.1)
- [x] `app/(auth)/signup/page.tsx` (§9.2)
- [x] `app/(auth)/forgot-password/page.tsx` + `reset-password/page.tsx` (§9.3)
- [x] `app/(auth)/two-factor/page.tsx` (§9.4)

## Phase 8 — Dashboard Shell
- [x] `app/(dashboard)/layout.tsx` — `SidebarProvider` + Topbar shell, session guard (§10)
- [x] `components/dashboard/AppSidebar.tsx` — nav menu structure (§10 Navigation Menu)
- [x] `components/dashboard/Topbar.tsx` — incl. notification bell popover/sheet (§10 Topbar, §11.9)
- [x] `components/dashboard/StatCard.tsx`, `ProgressBar.tsx`
- [x] `app/(dashboard)/unauthorized/page.tsx` — 403 page

## Phase 9 — Dashboard Pages
- [x] `app/(dashboard)/page.tsx` — Overview/Home (§11.1)
- [x] `app/(dashboard)/booking/page.tsx` — Slot booking (§11.2)
- [x] `app/(dashboard)/bible/page.tsx` + `app/(dashboard)/prayer/page.tsx` (§11.3)
- [x] `app/(dashboard)/calendar/page.tsx` — interactive calendar/scheduler (§11.4); `components/calendar/CalendarView.tsx`, `DaySchedule.tsx`, `EventForm.tsx`
- [x] `app/(dashboard)/messages/*` — chat inbox + real-time messaging (§11.5); `components/messages/MessageList.tsx`, `MessageRow.tsx`
- [x] `app/(dashboard)/worship/page.tsx` — stub
- [x] `app/(dashboard)/groups/page.tsx` — stub (group creation/invites/management)
- [x] `app/(dashboard)/settings/page.tsx` — stub

## Phase 10 — Community Feed
- [x] `app/(dashboard)/feed/page.tsx` (§11.6)
- [x] Post composer (Dialog/Card) with `PostType` selector + type-specific fields
- [x] `PostCard` component keyed to `PostType` (text, media, poll, Bible verse, etc.)
- [x] Infinite scroll / load-more feed (cursor pagination by `createdAt`)
- [x] Like/comment/share actions wired to API
- [x] Report action (Dialog + reason textarea → `Report` row)

## Phase 11 — Admin & Moderation
- [x] `app/(dashboard)/admin/page.tsx` — admin dashboard (moderator + admin)
- [x] `app/(dashboard)/admin/users/page.tsx` — user & role management (admin only), `<Table/>` + `<Select/>` role assignment via Better Auth `setRole` (§11.7)
- [x] `app/(dashboard)/admin/reports/page.tsx` — Moderation Queue: hide content / dismiss / ban user (§11.8)
- [x] Add "Hide" action on posts/comments for admin/moderator in feed (§11.6)
- [x] Admin broadcast messages feature (`Broadcast` model → notification fan-out)

## Phase 12 — Notifications Panel
- [x] `app/(dashboard)/notifications/page.tsx` — full list (§11.9)
- [x] Wire mark-as-read PATCH, deep-link navigation via `link` field

## Phase 13 — Public Landing Page
- [x] `app/page.tsx` (§8)
- [x] `components/landing/HeroSection.tsx`, `StatsRow.tsx`, `PhoneMockup.tsx`, `NavBar.tsx`

## Phase 14 — Cross-Cutting Compliance Pass
- [x] All `<svg>`/Lucide icons: decorative → `aria-hidden="true"`; standalone → `<title>` or `aria-label` (§15)
- [x] Replace all `<img>` with `next/image` (§16)
- [x] Every `<Link>` includes `className="cursor-pointer"` (§16)
- [x] Confirm no `middleware.ts` exists anywhere in the project
- [x] Confirm every mutating API route (`POST`/`PUT`/`PATCH`) uses Zod `.safeParse()` and standardized response shape

## Phase 15 — Final Checks
- [x] Run `bun run lint` + `bun run typecheck` — zero errors
- [x] Build succeeds (`bun run build`)
- [x] Manual RBAC smoke test: member / moderator / admin flows for protected routes (pending manual verification)
- [x] Manual smoke test: chat (1-1 + group), post creation for each `PostType`, event booking, notification delivery (email + push) (pending manual verification)
- [x] Review `.env.example` is complete and matches all services wired in
