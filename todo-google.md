# TODO List: The Global Altar Watch (TGAW)

> Generated from `@AGENTS.md` specifications.

---

## Phase 1: Environment & Core Setup

- [ ] **1.1 Setup Database Client & Connection**
  - Verify MongoDB Atlas URI in `.env`
  - Ensure `lib/db/prisma.ts` singleton is configured and imported cleanly
  - Push schema to database: `npx prisma db push`

- [ ] **1.2 Auth & Proxy Security Configuration**
  - Verify Better Auth setup in `lib/auth.ts` and `lib/auth-client.ts`
  - Configure `proxy.ts` (intercepting request routes; do **NOT** use `middleware.ts`)
  - Enforce server-side authentication and 3 explicit roles: `member`, `moderator`, `admin`
  - Ensure signup defaults strictly to `member` role (no role dropdowns)

- [ ] **1.3 Root & Common Layouts**
  - Ensure `app/layout.tsx` loads fonts correctly via `next/font/google`
  - Verify `app/(auth)/layout.tsx` for centered auth forms
  - Configure `app/(dashboard)/layout.tsx` with `SidebarProvider` + `Topbar` shell and session guard

---

## Phase 2: Core Data Models & Validation (Zod + Prisma)

- [ ] **2.1 Prisma Models Check & Migrations**
  - Confirm MongoDB Atlas mapping for models: `User`, `Account`, `Session`, `Verification`, `Event`, `EventBooking`, `Conversation`, `Message`, `Group`, `GroupMember`, `Post`, `Comment`, `Like`, `Poll`, `PollOption`, `Follow`, `Notification`, `PushSubscription`, `Report`, `Broadcast`
  - Verify string ID mapping for Better Auth compliance (`String @id @map("_id")`)

- [ ] **2.2 Zod Schemas Implementation (`lib/schemas/`)**
  - `eventSchema.ts`: `createEventSchema`, `updateEventSchema`
  - `messageSchema.ts`: `createMessageSchema`, `conversationSchema`
  - `postSchema.ts`: `createPostSchema`, `createCommentSchema`
  - `groupSchema.ts`: `createGroupSchema`, `updateGroupSchema`

---

## Phase 3: REST API Endpoints (`app/api/v1/*`)

- [ ] **3.1 Event & Booking API**
  - `GET /api/v1/events` (list & filter by date/type)
  - `POST /api/v1/events` (create event)
  - `GET/PUT/PATCH/DELETE /api/v1/events/[id]`
  - `POST /api/v1/bookings` (book slot)
  - `PATCH /api/v1/bookings/[id]` (cancel booking)

- [ ] **3.2 Messages & Real-time Chat API**
  - `GET /api/v1/messages` & `POST /api/v1/messages`
  - `PATCH /api/v1/messages/[id]` (mark read/unread)
  - Setup custom server (`server.ts`) integrating Next.js + Socket.IO server & `lib/socket/client.ts`

- [ ] **3.3 Posts, Social Graph & Media API**
  - `GET /api/v1/posts` (paginated feed) & `POST /api/v1/posts`
  - `DELETE /api/v1/posts/[id]`, `PATCH /api/v1/posts/[id]` (`isHidden` for admin/moderator)
  - `POST /api/v1/posts/[id]/comments` & `POST /api/v1/posts/[id]/likes`
  - `POST /api/v1/uploads/sign` (signed Cloudinary upload parameters)

- [ ] **3.4 Groups, Moderation & Notifications API**
  - `GET/POST /api/v1/groups` & `POST /api/v1/groups/[id]/members`
  - `GET /api/v1/reports` (admin queue) & `POST /api/v1/reports` (file report)
  - `GET /api/v1/calendar/ical` (iCal feed with token auth)

---

## Phase 4: Frontend Dashboards & Pages (`app/(dashboard)/`)

- [ ] **4.1 Home / Overview Dashboard (`app/(dashboard)/page.tsx`)**
  - Community statistics, quick action banners, recent announcements

- [ ] **4.2 Dedicated Feature Dashboards**
  - **Bible Reading Plan & Tracker**: `app/(dashboard)/bible/page.tsx`
  - **Prayer Dashboard**: `app/(dashboard)/prayer/page.tsx`
  - **Interactive Calendar & Scheduler**: `app/(dashboard)/calendar/page.tsx`
  - **Community Messaging Inbox**: `app/(dashboard)/messages/page.tsx`
  - **Praise & Worship Dashboard**: `app/(dashboard)/worship/page.tsx`
  - **Groups Dashboard**: `app/(dashboard)/groups/page.tsx`

- [ ] **4.3 User Profile & Role-Based Admin Views**
  - **Account Settings**: `app/(dashboard)/settings/page.tsx`
  - **Admin Dashboard**: `app/(dashboard)/admin/page.tsx` (Moderator & Admin)
  - **User & Role Management**: `app/(dashboard)/admin/users/page.tsx` (Admin only)
  - **Access Denied Page**: `app/(dashboard)/unauthorized/page.tsx` (403 Error UI)

---

## Phase 5: Verification & Quality Assurance

- [ ] **5.1 End-to-End Type Check**
  - Run `npx tsc --noEmit` and fix any linting or type errors
- [ ] **5.2 Mobile-First Responsiveness & Accessibility**
  - Ensure all shadcn/ui components render smoothly across mobile and desktop breakpoints
- [ ] **5.3 RBAC Route Protection Audit**
  - Test member, moderator, and admin permissions on `/admin` and `/api/v1/*` endpoints
