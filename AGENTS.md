# AGENTS.md

# Role & Task

> **Mandatory Reference Directive**: Always consult `@DESIGN.md` if present for design system guidelines, color tokens, layout hierarchy, and component rules, and `@prompt.md` for system architecture, schema rules, and implementation patterns. For the **Slot Booking feature** (the `/booking` page, `/bible`/`/prayer`/`/worship` booking strips, and the booking admin tools on `/admin`), always consult `@bookings.md` — it is the authoritative spec for the `Slot`, `MeetingLink`, and `BookingConfig` models, the `/api/v1/slots/*` routes, slot generation, and the booking UI.

You are an expert full-stack React & Node.js developer specialising in Next.js 16 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Prisma ORM, and Zod.

Your goal is to create a Christian Community Social Media App called "The Global Altar Watch (TGAW)". This is a modern Web Application built using **shadcn/ui** components and styling conventions.

### Feature Requirements:

- Real-time chat (1-1 and group chat).
- Group creation, invitation, and user management.
- Admin broadcast messages to all users.
- Full social interaction: comments, likes, shares, user following, post following.
- Content posting for text, media (images, video, audio, documents), links, polls, quotes, Bible verses, short notes, sermons, gospel tracts, articles, events, prayer requests, prayer answers, testimonials, and praise reports.
- Dedicated dashboards: Prayer Dashboard, Bible Reading Plan & Tracker, Praise & Worship Dashboard, and Event & Meeting Calendar Dashboard.
- Notification channels: Email, Push, and SMS.
- User profile & role-based management.

### Architectural Directives:

- Built on a **Mobile-First API Architecture** with decoupled `/api/v1/` REST endpoints ready for native mobile clients.
- Achieve end-to-end type safety with **MongoDB Atlas + Prisma ORM + Zod schema validation**.
- Protect all dashboard routes with server-side authentication and **Role-Based Access Control (RBAC)** using **Better Auth** (configured in `lib/auth.ts`) enforcing a five-tier role system: `member` (default), `coordinator`, `board`, `leader`, and `superadmin`.

### Premium Quality Bar (Apple App Store / Google Play Store):

TGAW is a **premium consumer product** built to a standard worthy of Apple App Store and Google Play Store review. This is a hard quality gate on all work — no demos, no "Coming Soon" stubs on shipped screens:

1. **Refined visual design**: consistent spacing rhythm, alignment, hierarchy, and motion. Use shadcn semantic tokens (`bg-background`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`) — never ad-hoc hex colors.
2. **Thoughtful micro-interactions**: tasteful transitions between states (tab switches, dialog opens, list items, buttons) using `motion/react`. Animate for meaning and delight, never noise. Respect `prefers-reduced-motion`.
3. **Empty, loading, and error states everywhere**: skeletons for async content, illustrated empty states with a clear CTA, and friendly inline errors.
4. **Mobile-first responsiveness**: every layout works from 360px phones to desktop. Touch targets ≥ 44px, thumb-friendly, no horizontal overflow.
5. **Accessibility (a11y)**: semantic HTML, ARIA labels, keyboard navigable, visible focus rings, sufficient contrast. Every `<svg>`/Lucide icon is `aria-hidden="true"` or has a `<title>`.
6. **Performance**: smooth 60fps interactions, `next/image` for raster media, no CLS, minimal client bundles.
7. **Consistency**: reuse the shadcn primitive set; when a composed variant exists (e.g. `@shadcn-space/*`), prefer it over bespoke hand-rolled controls. Add primitives via `bunx --bun shadcn@latest add <item>`.

---

## 1. Tech Stack & Architecture

1. **Framework & Engine**:

- **UI & UX Component Library**: Strictly **shadcn/ui** primitives (Radix UI, Lucide React icons, `cn()` utility via `clsx` and `tailwind-merge`).
- Next.js 16 (App Router) using React 19 server/client boundaries.
- TypeScript (`strict: true`).
- **Database & ORM**: MongoDB Atlas connected via **Prisma ORM** (MongoDB connector).
- **Validation & Types**: **Zod** for schema definitions, API request body/query validation, and shared TypeScript inferred types.
- **Authentication & RBAC**: **Better Auth** (`better-auth`) with `admin` plugin enabling strict **Role-Based Access Control (RBAC)** across a five-tier role system: `member` (default), `coordinator`, `board`, `leader`, and `superadmin`. Auth is configured in `lib/auth.ts`. Route protection is handled in `proxy.ts` — **do NOT use `middleware.ts**` (deprecated in this project).
- **Forms**: **React Hook Form** + **Zod** resolver (`@hookform/resolvers/zod`) paired with shadcn `<Form/>` fields.
- **Styling**: Tailwind CSS v4 using shadcn semantic variable tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-primary`, etc.) defined in `globals.css`.
- **Fonts**: Load standard Google Fonts (e.g. `Inter`) via `next/font/google` on the root layout.

2. **Mobile-First API Strategy**:

- All core UI mutations interact with a decoupled REST API under `app/api/v1/*`.
- Every `POST`, `PUT`, `PATCH` request is validated with Zod `.safeParse()` before reaching the database.
- Standardise all API responses:

```json
{ "success": true, "data": { ... }, "error": null }

```

- On validation failure return `400` with `{ "success": false, "error": <zod field errors> }`.

3. **Directory Structure**:

```text
app/
├── (auth)/
│   └── login/
│       └── page.tsx           # Split-panel / Card login page with shadcn UI
├── (dashboard)/
│   ├── layout.tsx             # SidebarProvider + Topbar shell, session guard
│   ├── page.tsx               # Overview / Home tab
│   ├── bible/
│   │   └── page.tsx           # Bible Reading Slots + Zoom links
│   ├── prayer/
│   │   └── page.tsx           # Prayer Slots + Zoom links
│   ├── calendar/
│   │   └── page.tsx           # Interactive Calendar & Scheduler
│   ├── messages/
│   │   └── page.tsx           # Community Messages inbox
│   ├── worship/
│   │   └── page.tsx           # Praise & Worship (stub page)
│   ├── groups/
│   │   └── page.tsx           # Groups (stub page)
│   ├── settings/
│   │   └── page.tsx           # Account Settings (stub page)
│   ├── admin/
│   │   ├── page.tsx           # Admin Portal (leader + superadmin)
│   │   ├── reports/
│   │   │   └── page.tsx       # Moderation Queue (leader + superadmin)
│   │   └── users/
│   │       └── page.tsx       # User & Role Management (superadmin only)
│   ├── coordinator/
│   │   └── page.tsx           # Timezone-scoped Coordinator Dashboard
│   ├── board/
│   │   └── page.tsx           # Org-wide Board Dashboard
│   └── unauthorized/
│       └── page.tsx           # 403 Access Denied page
├── api/
│   ├── auth/
│   │   └── [...all]/
│   │       └── route.ts       # Better Auth catch-all handler
│   └── v1/
│       ├── events/
│       │   ├── route.ts       # GET (list/filter by date & type), POST
│       │   └── [id]/
│       │       └── route.ts   # GET, PUT/PATCH, DELETE
│       ├── bookings/
│       │   ├── route.ts       # POST (book a slot)
│       │   └── [id]/
│       │       └── route.ts   # PATCH (cancel)
│       ├── messages/
│       │   ├── route.ts       # GET (list), POST
│       │   └── [id]/
│       │       └── route.ts   # PATCH (mark read/unread)
│       ├── posts/
│       │   ├── route.ts       # GET (feed, paginated), POST
│       │   └── [id]/
│       │       ├── route.ts   # GET, DELETE, PATCH (isHidden — admin)
│       │       ├── comments/route.ts
│       │       └── likes/route.ts
│       ├── groups/
│       │   ├── route.ts       # GET (list), POST
│       │   └── [id]/
│       │       └── members/route.ts
│       ├── reports/
│       │   └── route.ts       # GET (open queue — admin), POST (file a report)
│       ├── uploads/
│       │   └── sign/route.ts  # POST — signed Cloudinary upload params
│       └── calendar/
│           └── ical/route.ts  # GET — per-user iCal feed (token auth)
├── globals.css                # shadcn HSL / CSS variable tokens
├── layout.tsx                 # Root layout — Font CSS vars, Toaster provider
└── page.tsx                   # Public landing page using shadcn UI
actions/                       # Server actions ('use server')
│   ├── eventActions.ts
│   └── messageActions.ts
components/
├── ui/                        # Standard shadcn UI primitives (Button, Card, Dialog, Toast, Badge, Form, Input, etc.)
├── landing/                   # HeroSection, StatsRow, PhoneMockup, NavBar
├── dashboard/                 # AppSidebar, Topbar, StatCard, ProgressBar
├── calendar/                  # CalendarView, DaySchedule, EventForm
├── messages/                  # MessageList, MessageRow
└── zoom/                      # ZoomLinkCard, ZoomQuickJoinBanner
lib/
├── auth.ts                    # Better Auth config (providers, hooks, session shape)
├── auth-client.ts             # Better Auth client for use in client components
├── db/
│   └── prisma.ts              # Prisma Client singleton
├── schemas/
│   ├── eventSchema.ts         # Zod schemas + inferred types for Event
│   ├── messageSchema.ts       # Zod schemas + inferred types for Message
│   ├── postSchema.ts          # Zod schemas + inferred types for Post/Comment
│   └── groupSchema.ts         # Zod schemas + inferred types for Group
├── services/
│   ├── eventService.ts        # Prisma query layer for events
│   ├── messageService.ts      # Prisma query layer for messages
│   ├── postService.ts         # Prisma query layer for posts/comments/likes
│   └── groupService.ts        # Prisma query layer for groups/membership
├── socket/
│   ├── server.ts              # Socket.IO server setup, room/namespace logic
│   └── client.ts              # Socket.IO client singleton for client components
├── storage/
│   └── cloudinary.ts          # Cloudinary config + signed upload helper (swap target for S3)
├── notifications/
│   ├── email.ts               # Nodemailer transport + send helpers
│   ├── push.ts                # Web Push (VAPID) subscribe/send helpers
│   └── dispatch.ts            # Fan-out: picks channel(s) per notification type
└── utils.ts                   # Date helpers, cn() utility, error handlers
providers/                     # React context providers (Session, Theme, Toast, Socket)
│   ├── SessionProvider.tsx
│   └── SocketProvider.tsx     # Wraps app, exposes socket instance + connection state
public/
└── sw.js                      # Service worker — receives Web Push events
prisma/
└── schema.prisma              # MongoDB Atlas Prisma Schema
server.ts                      # Custom Node server — Next.js handler + Socket.IO on same HTTP server
proxy.ts                       # Route protection — replaces middleware.ts
.env.example                   # Required environment keys

```

---

## 2. Database Schema & Validation (Prisma + Zod)

### A. Prisma Schema (`prisma/schema.prisma`)

> **MongoDB & Better Auth ID Mapping Rule**: Better Auth generates random string IDs. Models associated with authentication (`User`, `Account`, `Session`, `Verification`) as well as foreign keys referencing `User.id` (such as `Event.userId` and `Message.recipientId`) **MUST** use plain `String @id @map("_id")` or `String` without `@db.ObjectId`.

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum EventType {
  BIBLE
  PRAYER
  PRAISE_WORSHIP
}

model Event {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  userId    String                        // owner/host — plain string from session user.id
  type      EventType
  title     String
  passage   String?                       // Bible passage or prayer focus
  date      String                        // YYYY-MM-DD
  time      String                        // HH:MM (24h)
  duration  Int                           // minutes
  capacity  Int?                          // max bookings; null = unlimited
  zoomUrl   String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  EventBooking[]
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
}

model EventBooking {
  id           String        @id @default(auto()) @map("_id") @db.ObjectId
  eventId      String        @db.ObjectId
  event        Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId       String                          // who booked the slot
  status       BookingStatus @default(CONFIRMED)
  reminderSent Boolean       @default(false)
  createdAt    DateTime      @default(now())

  @@unique([eventId, userId])
  @@index([userId])
}

enum ConversationType {
  DIRECT
  GROUP
}

model Conversation {
  id          String            @id @default(auto()) @map("_id") @db.ObjectId
  type        ConversationType
  groupId     String?           @db.ObjectId  // set when type = GROUP
  group       Group?            @relation(fields: [groupId], references: [id])
  memberIds   String[]                        // participant user.id list (DIRECT: exactly 2)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  messages    Message[]

  @@index([memberIds])
}

model Message {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  conversationId   String       @db.ObjectId
  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId         String                      // author user.id
  body             String
  attachmentUrl    String?                     // Cloudinary URL, if any
  readBy           String[]                    // user.id list who have seen it
  createdAt        DateTime     @default(now())

  @@index([conversationId])
}

// --- Groups ---

enum GroupRole {
  member
  moderator
  owner
}

model Group {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  description   String?
  coverImageUrl String?                        // Cloudinary URL
  isPrivate     Boolean        @default(false)
  ownerId       String                          // creator user.id
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  members       GroupMember[]
  conversations Conversation[]
}

model GroupMember {
  id       String    @id @default(auto()) @map("_id") @db.ObjectId
  groupId  String    @db.ObjectId
  group    Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId   String
  role     GroupRole @default(member)
  joinedAt DateTime  @default(now())

  @@unique([groupId, userId])
  @@index([userId])
}

// --- Posts & content ---

enum PostType {
  TEXT
  MEDIA
  LINK
  POLL
  BIBLE_VERSE
  QUOTE
  SERMON
  GOSPEL_TRACT
  ARTICLE
  PRAYER_REQUEST
  PRAYER_ANSWER
  TESTIMONIAL
  PRAISE_REPORT
}

model Post {
  id           String     @id @default(auto()) @map("_id") @db.ObjectId
  authorId     String                       // user.id
  type         PostType
  body         String?
  mediaUrls    String[]                     // Cloudinary URLs (image/video/audio/document)
  linkUrl      String?
  versePassage String?                      // for BIBLE_VERSE posts
  isAnswered   Boolean?   @default(false)    // for PRAYER_REQUEST posts
  isHidden     Boolean    @default(false)    // set true by leader/superadmin moderation action
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  comments     Comment[]
  likes        Like[]
  poll         Poll?

  @@index([authorId])
  @@index([type])
}

model Comment {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  postId    String   @db.ObjectId
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  body      String
  isHidden  Boolean  @default(false)         // set true by leader/superadmin moderation action
  createdAt DateTime @default(now())

  @@index([postId])
}

enum LikeTargetType {
  POST
  COMMENT
}

model Like {
  id         String         @id @default(auto()) @map("_id") @db.ObjectId
  postId     String?        @db.ObjectId
  post       Post?          @relation(fields: [postId], references: [id], onDelete: Cascade)
  targetType LikeTargetType
  targetId   String                        // Post.id or Comment.id
  userId     String
  createdAt  DateTime       @default(now())

  @@unique([targetType, targetId, userId])
  @@index([postId])
}

model Poll {
  id        String       @id @default(auto()) @map("_id") @db.ObjectId
  postId    String       @unique @db.ObjectId
  post      Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  question  String
  options   PollOption[]
  closesAt  DateTime?
}

model PollOption {
  id      String @id @default(auto()) @map("_id") @db.ObjectId
  pollId  String @db.ObjectId
  poll    Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  label   String
  voterIds String[]                        // user.id list who voted this option
}

// --- Social graph ---

model Follow {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  followerId  String                       // user.id who follows
  followingId String                       // user.id being followed (self-follow not allowed at app layer)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followingId])
}

// --- Notifications & broadcasts ---

enum NotificationChannel {
  EMAIL
  PUSH
}

enum NotificationType {
  NEW_MESSAGE
  NEW_COMMENT
  NEW_LIKE
  NEW_FOLLOWER
  GROUP_INVITE
  PRAYER_UPDATE
  SLOT_REMINDER
  ADMIN_BROADCAST
}

model Notification {
  id        String               @id @default(auto()) @map("_id") @db.ObjectId
  userId    String                                  // recipient
  type      NotificationType
  channel   NotificationChannel
  title     String
  body      String
  link      String?                                 // in-app deep link
  isRead    Boolean              @default(false)
  createdAt DateTime             @default(now())

  @@index([userId])
}

model PushSubscription {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  @@index([userId])
}

enum ReportTargetType {
  POST
  COMMENT
  USER
}

enum ReportStatus {
  OPEN
  RESOLVED
}

model Report {
  id         String           @id @default(auto()) @map("_id") @db.ObjectId
  targetType ReportTargetType
  targetId   String                          // Post.id, Comment.id, or User.id
  reporterId String                          // user.id who filed the report
  reason     String
  status     ReportStatus     @default(OPEN)
  createdAt  DateTime         @default(now())

  @@index([status])
}

model Broadcast {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  authorId  String                        // leader/superadmin user.id
  title     String
  body      String
  createdAt DateTime @default(now())
}

enum Role {
  member
  coordinator
  board
  leader
  superadmin
}

model CoordinatorAssignment {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String                            // coordinator user.id
  timezone  String                            // one assigned timezone per row
  createdAt DateTime @default(now())

  @@unique([userId, timezone])
  @@index([userId])
}

model User {
  id            String    @id @map("_id")
  email         String    @unique
  passwordHash  String?
  name          String
  initials      String?
  role          Role      @default(member)
  banned        Boolean?  @default(false)
  banReason     String?
  banExpires    DateTime?
  streakDays    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  emailVerified Boolean
  image         String?
  sessions      Session[]
  accounts      Account[]

  @@map("user")
}

model Session {
  id             String   @id @map("_id")
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime
  updatedAt      DateTime
  ipAddress      String?
  userAgent      String?
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  impersonatedBy String?

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id @map("_id")
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String    @id @map("_id")
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@index([identifier])
  @@map("verification")
}

```

### B. Zod Schemas (`lib/schemas/eventSchema.ts`)

```typescript
import { z } from "zod"

export const eventTypeSchema = z.enum(["BIBLE", "PRAYER"])

export const createEventSchema = z.object({
  type: eventTypeSchema,
  title: z.string().min(1, "Title is required"),
  passage: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)"),
  duration: z.number().int().positive(),
  zoomUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
})

export const updateEventSchema = createEventSchema.partial()
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
```

### C. Prisma Client Singleton (`lib/db/prisma.ts`)

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

---

## 3. Authentication & RBAC (Better Auth)

> **AGENTS.md rule**: Global `middleware.ts` is **deprecated** in this project. All request interception and route protection lives in `proxy.ts`. Do not create or modify `middleware.ts`.
> **Role system**: Five explicit roles must be enforced (ascending): `member` (default), `coordinator`, `board`, `leader`, and `superadmin`.
>
> | Role | Access |
> |------|--------|
> | `member` | Default. Feed, chat, groups, booking, devotion pages. |
> | `coordinator` | + timezone-scoped coordinator dashboard (`/coordinator`) gated to their assigned timezones. |
> | `board` | + org-wide read-oriented board dashboard (`/board`), messaging/broadcast to `leader`s. No slot, user, or external-link admin. |
> | `leader` | + admin portal (`/admin`: slot admin, reports, moderation queue, external links, Watch-Leader assignment). |
> | `superadmin` | Full system access. **Only** `superadmin` can promote/demote roles via User Management (`/admin/users`). |
>
> `superadmin` passes every RBAC check; the role guard in `proxy.ts` short-circuits to `NextResponse.next()`.
>
> **Sign-up rule**: There is **no role selector anywhere in the sign-up form**. Every new account is created with `role: "member"` (unless the verified email matches the `SUPERADMIN_EMAILS` allowlist — see below). Role changes can only be made by an existing `superadmin` via the User Management page (§11.7) calling Better Auth's admin `setRole` API — never by the user themselves.
> **Superadmin bootstrap**: `lib/auth.ts` defines a `databaseHooks.user.create.before` hook that auto-assigns `role: "superadmin"` to sign-ups whose **verified email** (never display name) matches the comma-separated `SUPERADMIN_EMAILS` env allowlist. Everyone else gets `member`.
> **Admin plugin split**: Better Auth's `admin` plugin (`setRole`, `banUser`, impersonation, etc.) is configured with `adminRole: ["superadmin"]` only — those are destructive/account-level powers and stay `superadmin`-exclusive. `leader`'s ban/unban and moderation actions are implemented as **custom app-level routes that check role directly**, NOT routed through the admin plugin.
> **No phone auth**: Login is email/password + social providers only. There is no phone/SMS-based sign-in or verification anywhere in this app.

### A. Authentication Flow

1. **Sign-Up / Login Screen** (`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`) — email/password fields (shadcn `<Form/>`) plus "Continue with Google" / "Continue with Microsoft" social buttons. No role field. On sign-up, `emailVerified` starts `false`; a verification email is sent via Nodemailer.
2. **Forgot Password / Reset Flow** — `app/(auth)/forgot-password/page.tsx` collects an email and calls `authClient.forgetPassword({ email, redirectTo: "/reset-password" })`; Better Auth emails a reset link (sent via the Nodemailer transport in §7). `app/(auth)/reset-password/page.tsx` reads the token from the URL and calls `authClient.resetPassword({ newPassword, token })`.
3. **Two-Factor Authentication (TOTP, free)** — enabled via Better Auth's `twoFactor` plugin (authenticator-app based, no SMS provider needed). A user opts in from Settings, scans a QR code (`authClient.twoFactor.enable()`), and confirms a code. On future logins where 2FA is enabled, `authClient.signIn.email()` returns a `twoFactorRedirect`, and `app/(auth)/two-factor/page.tsx` collects the 6-digit code via `authClient.twoFactor.verifyTotp({ code })`.

### B. Better Auth Config (`lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth"
import { admin, customSession, haveIBeenPwned, openAPI, twoFactor } from "better-auth/plugins"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { sendEmail } from "@/lib/notifications/email"

const client = new MongoClient(process.env.DATABASE_URL as string)
const db = client.db()

export const auth = betterAuth({
  appName: "TGAW",
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) =>
      sendEmail(user.email, "Reset your TGAW password", `<a href="${url}">Reset password</a>`),
  },
  emailVerification: {
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendEmail(user.email, "Verify your TGAW email", `<a href="${url}">Verify email</a>`),
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: "common",
      prompt: "select_account",
    },
  },
  // Superadmin bootstrap: verified email vs SUPERADMIN_EMAILS allowlist
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowed = (process.env.SUPERADMIN_EMAILS || "")
            .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
          if (user.email && allowed.includes(user.email.toLowerCase())) {
            return { data: { ...user, role: "superadmin" } }
          }
          return { data: user }
        },
      },
    },
  },
  plugins: [
    openAPI(),
    admin({
      defaultRole: "member",
      adminRole: ["superadmin"],
    }),
    twoFactor(),
    haveIBeenPwned(),
  ],
})
```

### C. Better Auth Client (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [adminClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
```

### D. Better Auth Route Handler (`app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

### E. Route Protection & RBAC (`proxy.ts`)

```typescript
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = [
  "/overview",
  "/bible",
  "/prayer",
  "/calendar",
  "/messages",
  "/worship",
  "/groups",
  "/settings",
  "/admin",
  "/coordinator",
  "/board",
  "/feed",
  "/notifications",
  "/booking",
]

const SUPERADMIN_ONLY_PATHS = ["/admin/users"] // role changes, bans
const ADMIN_PORTAL_PATHS = ["/admin"] // admin portal + moderation queue
const COORDINATOR_PATHS = ["/coordinator"]
const BOARD_PATHS = ["/board"]

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = (session.user.role as string) || "member"

  // superadmin short-circuit (passes all RBAC checks)
  if (role === "superadmin") {
    return NextResponse.next()
  }

  // User Management / Role Assignment: superadmin only
  if (SUPERADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Admin Portal (slot admin, reports, moderation queue, etc.): leader + superadmin
  if (ADMIN_PORTAL_PATHS.some((p) => path.startsWith(p)) && role !== "leader") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Coordinator Dashboard: coordinator + superadmin
  if (COORDINATOR_PATHS.some((p) => path.startsWith(p)) && role !== "coordinator") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Board Dashboard: board + superadmin
  if (BOARD_PATHS.some((p) => path.startsWith(p)) && role !== "board") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
}
```

---

## 4. API Handler Pattern (`app/api/v1/events/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createEventSchema } from "@/lib/schemas/eventSchema"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const body = await req.json()
  const validation = createEventSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const event = await prisma.event.create({
    data: { ...validation.data, userId: session.user.id! },
  })
  return NextResponse.json({ success: true, data: event }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const type = searchParams.get("type")

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id!,
      ...(date ? { date } : {}),
      ...(type ? { type: type as "BIBLE" | "PRAYER" } : {}),
    },
    orderBy: { time: "asc" },
  })
  return NextResponse.json({ success: true, data: events })
}
```

---

## 5. Real-Time Chat (Socket.IO, self-hosted)

> **Hosting constraint**: this project runs Next.js behind a **custom Node server** (`server.ts`), not on pure serverless — Socket.IO needs a long-lived HTTP server to hold connections open. Do not deploy this app to a platform that only supports serverless functions (e.g. plain Vercel serverless) without a persistent-process option.

### A. Custom Server (`server.ts`)

```typescript
import { createServer } from "node:http"
import next from "next"
import { Server } from "socket.io"
import { auth } from "@/lib/auth"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))
  const io = new Server(httpServer, { path: "/socket.io" })

  io.use(async (socket, next) => {
    const session = await auth.api.getSession({
      headers: socket.handshake.headers as any,
    })
    if (!session?.user) return next(new Error("Unauthorized"))
    socket.data.userId = session.user.id
    next()
  })

  io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(conversationId)
    })

    socket.on("message:send", async (payload) => {
      // validate with messageSchema, persist via messageService, then:
      io.to(payload.conversationId).emit("message:new", payload)
    })
  })

  httpServer.listen(process.env.PORT || 3000)
})
```

### B. Client Provider (`providers/SocketProvider.tsx`)

- Connects once at the app root using `io({ path: "/socket.io" })`, cookies carry the Better Auth session for the handshake.
- Exposes the socket instance and a `connected` boolean via context; components join/leave conversation rooms with `conversation:join` / `conversation:leave` on mount/unmount.
- Direct messages and group messages both flow through `Conversation` — a `DIRECT` conversation is created (or reused) between two users on first message; a `GROUP` conversation is created when a `Group` is created.

### C. Conventions

- Socket events are the source of truth for **live delivery**; the REST API (`/api/v1/messages`) remains the source of truth for **persistence and history** (initial load, pagination, read receipts sync). Never rely on socket state alone for message history.
- Every socket handler re-validates the sender's membership in the conversation/group server-side before broadcasting — never trust `conversationId` from the client without an ownership check.

---

## 6. Media Storage (Cloudinary)

> Chosen for its free tier (no card required) to keep hosting cost at $0. Keep all upload logic behind `lib/storage/cloudinary.ts` so swapping to S3 later only means rewriting that one file.

### A. Config (`lib/storage/cloudinary.ts`)

```typescript
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function getSignedUploadParams(folder: string) {
  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  )
  return {
    timestamp,
    signature,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }
}
```

### B. Upload Pattern

- Client requests a signed payload from `POST /api/v1/uploads/sign` (auth required), then uploads **directly** to Cloudinary from the browser — the app server never proxies file bytes.
- Allowed types/size limits are enforced both client-side (immediate feedback) and via Cloudinary upload preset restrictions (source of truth).
- Store only the resulting Cloudinary `secure_url` (and `public_id` for later deletion) on the owning record (`Post.mediaUrls`, `Message.attachmentUrl`, `Group.coverImageUrl`, `User.image`).
- Deleting a `Post`/`Message` should also call `cloudinary.uploader.destroy(publicId)` to avoid orphaned assets.

---

## 7. Notifications (Nodemailer + Web Push)

> No SMS channel — kept to two free channels: **Email** (Nodemailer) and **Push** (Web Push / VAPID, browser-native, no third-party service or cost).

### A. Email (`lib/notifications/email.ts`)

```typescript
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html })
}
```

- Use a free SMTP provider for development/low volume (e.g. Gmail SMTP with an app password, or a free-tier transactional provider) — swap `SMTP_*` env vars only, no code change.

### B. Web Push (`lib/notifications/push.ts`)

```typescript
import webpush from "web-push"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPush(
  subscription: PushSubscriptionJSON,
  title: string,
  body: string
) {
  await webpush.sendNotification(
    subscription as any,
    JSON.stringify({ title, body })
  )
}
```

- `public/sw.js` registers a `push` event listener that calls `self.registration.showNotification(...)`.
- Client asks for `Notification.permission` and, once granted, subscribes via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`; the subscription object is POSTed to the API and stored in `PushSubscription`.
- `NotificationType` values (`NEW_MESSAGE`, `NEW_COMMENT`, `NEW_LIKE`, `NEW_FOLLOWER`, `GROUP_INVITE`, `PRAYER_UPDATE`, `SLOT_REMINDER`, `ADMIN_BROADCAST`) map to a channel in `lib/notifications/dispatch.ts` — always write an in-app `Notification` row, then fan out to Email and/or Push depending on the type and the user's stored preferences.

### C. Slot Reminder Scheduling

- Since `server.ts` is already a persistent Node process (§5), use `node-cron` inside it (no external cron/queue service needed) to run every few minutes, find confirmed `EventBooking` rows starting soon with `reminderSent: false`, dispatch a `SLOT_REMINDER` notification, and flip `reminderSent`.

---

## 8. Public Landing Page (`app/page.tsx`)

Build using clean **shadcn/ui** layout components, `<Button/>`, `<Badge/>`, and `<Card/>`.

1. **Navbar**: Standard header using shadcn flex primitives, site brand title, navigation items, and `<Button asChild>` linking to `/login`.
2. **Hero Section**: Responsive 2-column container using grid/flex.

- Left: Badge ("Your Daily Faith Companion"), `<h1>`, subtitle, primary Action `<Button>` ("Get Started Free"), secondary Action `<Button variant="outline">` ("Sign In").
- Right: Clean preview card (`<Card/>`) showing today's scripture and schedule summary using `<Badge/>` tags for event timing.

3. **Stats Row**: Grid layout using standard `<Card/>` components displaying community metrics.

---

## 9. Sign-Up, Login & 2FA Pages (`app/(auth)/*`)

Implement using **shadcn/ui** `<Form/>`, `<FormField/>`, `<FormItem/>`, `<FormLabel/>`, `<FormControl/>`, `<FormMessage/>`, `<Input/>`, and `<Button/>`.

### 9.1 Login (`app/(auth)/login/page.tsx`)

- Form handling with `react-hook-form` and `@hookform/resolvers/zod`.
- Primary submission triggers `authClient.signIn.email({ email, password })`. If the response includes `twoFactorRedirect`, route to `/two-factor` instead of the dashboard.
- Social authentication button triggers `authClient.signIn.social({ provider: "google" })` / `{ provider: "microsoft" }`.
- "Forgot password?" link to `/forgot-password`.
- Feedback presented via shadcn `<Alert/>` or `toast()`.

### 9.2 Sign-Up (`app/(auth)/signup/page.tsx`)

- Fields: name, email, password (no role field — every account is created as `member`; see §3).
- Submission triggers `authClient.signUp.email({ name, email, password })`, then shows a "check your email to verify" state.

### 9.3 Forgot Password / Reset (`app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`)

- Forgot-password form collects email, calls `authClient.forgetPassword({ email, redirectTo: "/reset-password" })`, shows a generic "if that email exists, a link was sent" message (never confirms whether the email is registered).
- Reset-password page reads `token` from the query string, collects a new password, calls `authClient.resetPassword({ newPassword, token })`, then redirects to `/login`.

### 9.4 Two-Factor Verification (`app/(auth)/two-factor/page.tsx`)

- Single 6-digit code `<Input/>` (numeric, auto-submit on 6 digits), calls `authClient.twoFactor.verifyTotp({ code })`.
- Settings page also has an "Enable 2FA" flow: `authClient.twoFactor.enable()` returns a QR code to render, then the user confirms with a code to activate it.

---

## 10. Dashboard Layout (`app/(dashboard)/layout.tsx`)

Uses shadcn's official **Sidebar** component pattern (`SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`).

### Navigation Menu structure:

- **Overview**: Dashboard (Home)
- **Devotion**: Calendar, Bible Reading, Prayer, Praise & Worship, Slot Booking
- **Community**: Feed, Messages (with `<Badge/>` for unread count), Groups
- **Account**: Settings, Sign Out
- **Role-scoped sections** (rendered conditionally by `AppSidebar` based on the signed-in user's role):
- Coordinator Dashboard (`/coordinator`, `coordinator` + `superadmin`)
- Org Dashboard (`/board`, `board` + `superadmin`)
- Admin Portal (`/admin`, `leader` + `superadmin`)
- Moderation Queue (`/admin/reports`, `leader` + `superadmin`)
- User Management (`/admin/users`, `superadmin` only)

### Topbar (`components/dashboard/Topbar.tsx`):

- `SidebarTrigger` to toggle off-canvas menu on mobile views.
- Dynamic page title via `usePathname()`.
- Right actions: Notification bell with indicator badge (opens the Notifications panel, §11.6), User `<Avatar/>` dropdown menu.

---

## 11. Page Implementations (shadcn/ui Pattern)

### 11.1 Overview Page (`app/(dashboard)/page.tsx`)

- Stat Cards using `<Card/>`, `<CardHeader/>`, `<CardTitle/>`, and `<CardContent/>`.
- Today's Schedule using `<Table/>` or stacked list components.
- Progress bars using shadcn `<Progress/>` (e.g. Bible Reading Plan streak).
- **Book a Slot** shortcut: a prominent `<Button>` linking to `/booking` (§11.2).
- **Upcoming Slots preview**: next 2-3 `EventBooking` rows for the signed-in user (Bible Reading, Prayer, Praise & Worship), each showing type `<Badge/>`, date/time, and a "Join" action once the Zoom link is live.
- **Notifications panel**: a compact list (last 5 unread `Notification` rows) with a "View all" link into the full panel (§11.6); bell icon in the Topbar opens the same panel as a `<Sheet/>` or `<Popover/>`.
- **Community Feed shortcut**: a `<Card/>` teaser showing the latest 1-2 feed posts with a "View Feed" link to `/feed`.
- Alert / Highlight cards using `<Alert/>` or `<Card/>`.

### 11.2 Slot Booking (`app/(dashboard)/booking/page.tsx`)

> **Authoritative spec**: `@bookings.md` fully specifies the Slot Booking feature (models, business rules, API, UI, RBAC). This section summarises the implemented architecture; always consult `@bookings.md` before modifying booking code.

- **Slot model**: auto-generated 30-min devotional grid — 48 slots × 3 types (`BIBLE` / `PRAYER` / `PRAISE_WORSHIP`) = 144 slots/day, stored in UTC on the `Slot` model (`prisma/schema.prisma`). One user per slot; no cross-type overlap; consecutive multi-slot booking; per-type daily limits from `BookingConfig`.
- **On-demand generation**: `GET /api/v1/slots` (and the server-side devotion pages) call `ensureSlotsForDate()` in `lib/services/slotService.ts` — if no slots exist for a date, the rolling window (current month → end of next month) is generated on the fly. The cron/leader-protected `POST /api/v1/slots/generate` remains for scheduled pre-generation.
- **Type selection**: `<Tabs/>` for Bible Reading / Prayer / Praise & Worship (`EventType`).
- **Timeline + multi-select**: `SlotTimeline` renders the 48 slots for the selected type/date; users select one or more consecutive slots and confirm via the `SlotBookingSheet` (server action `bookSlotAction` → `POST /api/v1/slots/book`).
- **Meeting links**: one shared Zoom/Teams URL per type per date (`MeetingLink` model), managed by leaders via the Admin Portal (`AdminMeetingLinkManager`), surfaced to bookers via `MeetingLinkCard`.
- **Cancellation**: self-cancel (`cancelSlotAction` → `POST /api/v1/slots/cancel`) frees the slot; admins can assign (`/api/v1/slots/assign`) or force-cancel (`/api/v1/slots/admin-cancel`) any booking.
- **Visibility modes**: the active `BookingConfig.visibilityMode` (1–4) controls how much booking detail (name/avatar) is exposed; default is Mode 4 (Role-Scoped).

### 11.3 Bible & Prayer Pages (`/bible`, `/prayer`)

- Structured with grid panels using `<Card/>` wrappers.
- Zoom cards with status `<Badge/>` (e.g. `variant="default"` vs `variant="secondary"`).
- Action triggers using standard `<Button size="sm" variant="outline">`.

### 11.4 Calendar Page (`app/(dashboard)/calendar/page.tsx`)

- **Unified, color-coded calendar**: shadcn `<Calendar/>` (or a grid view) rendering all of a user's `Event`/`EventBooking` records, color-coded per `EventType` (e.g. Bible = blue, Prayer = amber, Praise & Worship = violet) via Tailwind token classes, not raw hex.
- **Filter by slot type**: `<ToggleGroup/>` or `<Select/>` to show/hide each `EventType`.
- **External calendar sync**: a "Subscribe" `<Button/>` copies a personal iCal feed URL (`GET /api/v1/calendar/ical?token=...`) that a user pastes into Google/Apple/Outlook Calendar — one-way, read-only, no OAuth. The endpoint returns `text/calendar` built from that user's confirmed `EventBooking` rows; the `token` is a long-lived per-user secret (regenerable from Settings) rather than the session cookie, since calendar apps can't do interactive login.
- Add Event Form (admin/host only) using shadcn `<Form/>`, `<Input/>`, `<Select/>`, and `<Textarea/>`.
- Toast notifications fired via shadcn `toast()` hook on event creation or deletion.

### 11.5 Messaging & Chat (`app/(dashboard)/messages/*`)

- **Conversation list** (`app/(dashboard)/messages/page.tsx`): inbox of `Conversation` rows, unread items styled via subtle background highlights (`bg-muted/50`); user avatars rendered using `<Avatar/>`, `<AvatarImage/>`, and `<AvatarFallback/>`. Group conversations show the `Group` name/cover image instead of a single avatar.
- **1-to-1 chat screen** (`app/(dashboard)/messages/[conversationId]/page.tsx`): message list joined to the Socket.IO room for that `conversationId` (§5); composer at the bottom.
- **Group chat screen** (`app/(dashboard)/groups/[groupId]/chat/page.tsx`): same message-list/composer pattern scoped to the group's `Conversation`, plus a member-list `<Sheet/>` (useful for named groups like a Prayer Circle or Bible Study group).
- **Composer**: plain `<Textarea/>` with lightweight rich text (bold/italic/lists — a small free library such as `tiptap` is fine, avoid a heavy paid WYSIWYG), an emoji picker (`emoji-picker-react`, free), and a media-attach button that uploads to Cloudinary (§6) and sends the resulting URL as `Message.attachmentUrl`.

### 11.6 Community Feed (`app/(dashboard)/feed/page.tsx`)

- **Post composer**: a `<Dialog/>` or inline `<Card/>` with a `PostType` selector (testimony, devotional, praise report, prayer request, Bible verse, poll, etc. — see `PostType` enum) and type-specific fields (verse passage, poll options, media upload via Cloudinary).
- **Feed list**: infinite-scroll or "Load more" `<Button/>` over `Post` rows (paginate by `createdAt` cursor), each rendered via a `PostCard` component keyed to `PostType` (e.g. a Bible verse post looks different from a poll post).
- **Like / comment / share**: `<Button size="icon">` actions; likes call `POST /api/v1/posts/:id/likes` (toggles a `Like` row); comments expand an inline list + composer; share copies a deep link.
- **Report action**: every post/comment has a "Report" option in a `<DropdownMenu/>` that opens a short reason `<Textarea/>` and creates a `Report` row.
- **Moderation tools for leaders**: `leader`/`superadmin` see an extra "Hide" action directly on posts/comments (`isHidden = true`, soft-hides without deleting) in addition to the Moderation Queue (§11.8) that lists open `Report`s for review.

### 11.7 Admin & RBAC Pages

- User management implemented using shadcn `<Table/>`, `<TableHeader/>`, `<TableBody/>`, `<TableRow/>`, `<TableCell/>`.
- Role assignment implemented using shadcn `<Select/>` dropdown inside table cells (calls the Better Auth admin `setRole` API — `superadmin` only, per §3). The picker lists the five roles: `member`, `coordinator`, `board`, `leader`, `superadmin`. Assigning `coordinator` additionally writes one or more rows to `CoordinatorAssignment`.
- Unauthorized 403 page built with `<Card/>` and clear fallback `<Button/>` returning to dashboard.

### 11.8 Moderation Queue (`app/(dashboard)/admin/reports/page.tsx`)

- `leader`/`superadmin` only. `<Table/>` of open `Report` rows (target type, reason, reporter, date) with row actions: "Hide content" (sets `isHidden` on the target `Post`/`Comment`), "Dismiss" (marks the `Report` `RESOLVED` with no action), or "Ban user" (`leader`/`superadmin` — existing `User.banned`/`banReason` fields, enforced by **app-level role checks**, NOT the Better Auth `admin` plugin).

### 11.9 Notifications Panel

- Full list at `app/(dashboard)/notifications/page.tsx`, plus the Topbar bell `<Popover/>`/`<Sheet/>` preview from §11.1.
- Each `Notification` row renders an icon + text based on `NotificationType` (slot reminders, group activity such as new messages/invites, prayer request updates, admin broadcasts) and is clickable via its `link` field; marking read is a `PATCH` that flips `isRead`.

---

## 12. Design System & UI/UX Specification (shadcn/ui Integration)

### A. Design Tokens & Globals (`globals.css`)

Rely entirely on standard shadcn HSL / CSS custom properties:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### B. Utility Helper (`lib/utils.ts`)

Standard shadcn class merging helper:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### B1. Tailwind v4 CSS Variable Syntax (Important)

This project uses **Tailwind CSS v4**. Arbitrary values that reference CSS custom
properties MUST use the **parenthesized syntax**, NOT square brackets:

- ✅ **Correct**: `min-w-(--radix-popper-anchor-width)` (compiles to `min-width: var(--radix-popper-anchor-width)`)
- ❌ **Wrong**: `min-w-[--radix-popper-anchor-width]` (compiles to the invalid `min-width: --radix-popper-anchor-width;` — the browser silently drops it, so the property falls back to any fixed default)

Anything in `[x]` is treated as a literal value; to reference an existing CSS
variable you must wrap it with `var()` (`min-w-[var(--x)]`) or use the `(--x)`
shorthand. Rule of thumb: **brackets for literal values, parens for CSS variables.**

Known cases to watch for: Radix UI sets `--radix-*` custom properties
(e.g. `--radix-popper-anchor-width`, `--radix-popover-content-transform-origin`,
`--radix-tooltip-content-transform-origin`) — always reference these with `(--...)`.

---

## 13. Environment Variables (`.env.example`)

```bash
# MongoDB Atlas
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"

# Better Auth
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Comma-separated emails auto-promoted to superadmin on signup (verified email match)
SUPERADMIN_EMAILS="admin@tgaw.app,superadmin@tgaw.app"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Email (Nodemailer / SMTP — free-tier provider or Gmail app password)
BETTER_AUTH_EMAIL="noreply@tgaw.app"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@tgaw.app"

# Media Storage (Cloudinary free tier — swap target for S3 later)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Web Push (VAPID — free, no third-party service)
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_CONTACT_EMAIL="admin@tgaw.app"

```

---

## 14. Execution Checklist

Use `bun` / `bunx` for all package and runtime commands.

1. **Install shadcn UI**: Run `bunx shadcn@latest init` to ensure components are pre-configured.
2. **Prisma setup**: Run `bunx prisma db push` and `bunx prisma generate`.
3. **Better Auth**: Wire `lib/auth.ts`, `lib/auth-client.ts`, and `app/api/auth/[...all]/route.ts`.
4. **Proxy Protection**: Configure `proxy.ts` for route protection and RBAC guards. **Do not create `middleware.ts**`.
5. **Custom Server**: Build `server.ts` (Next.js handler + Socket.IO on one HTTP server). Update `package.json` scripts to run `server.ts` via `tsx`/`ts-node` instead of `next dev`/`next start` directly.
6. **Real-Time Chat**: Wire `lib/socket/server.ts`, `lib/socket/client.ts`, and `providers/SocketProvider.tsx`.
7. **Media Storage**: Wire `lib/storage/cloudinary.ts` and the signed-upload endpoint (`/api/v1/uploads/sign`).
8. **Notifications**: Wire `lib/notifications/email.ts` (Nodemailer), `lib/notifications/push.ts` (Web Push), `public/sw.js`, and `lib/notifications/dispatch.ts`.
9. **UI Components**: Add required shadcn primitives (`bunx shadcn@latest add button card form input dropdown-menu avatar badge table calendar dialog select progress toast`).
10. **API Endpoints**: Build validated REST handlers under `/api/v1/` (events, messages, posts, comments, likes, groups, polls, uploads).
11. **Pages**: Implement Landing, Auth, Dashboard, Devotion, Calendar, Messages, Groups, and Admin management pages using shadcn/ui components.
12. **Lint & Check**: Run `bun run check` (Biome) before committing.

---

## 15. Client-Side Gotchas

1. **Never ship browser dialogs**: `window.prompt`/`confirm`/`alert` are banned in shipped UI — use shadcn `Dialog`/`AlertDialog` instead (e.g. password confirmation for 2FA backup-code regeneration).
2. **Navigation**: use `router.push()`/`redirect()`/`<Link>`, never `window.location.href = "..."` (hard reloads lose state and flash the whole app).
3. **Theme FOUC**: the theme provider applies `.dark`/`.light` in a `useEffect`; the root layout keeps a tiny inline `<script>` at the top of `<body>` (reads `localStorage` + `prefers-color-scheme`, sets the class pre-paint). Don't render a manual `<head>` — Next manages it.
4. **No scratch pages**: never commit `app/test/**`, `/test/**`, or demo/stub pages. Delete them before committing.
5. **Scratch artifacts**: gitignore `/.playwright-cli/` (console-*.log, page-*.yml) and `logs/` up front so Playwright/tooling runs never get committed.

---

## 16. SVG Accessibility & Linting (`no-svg-without-title`)

All `<svg>` elements or Lucide React icons must adhere to Biome accessibility rules:

1. Decorative icons must include `aria-hidden="true"`.
2. Standalone icons must include a `<title>` or explicit `aria-label`.

---

## 17. Next.js Directives

- **Images**: Always use `next/image` (`<Image/>`) instead of native `<img>` elements.
- **Links**: Every `<Link>` component must explicitly include `className="cursor-pointer"`.
