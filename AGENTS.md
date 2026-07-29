# Role & Task

> **Mandatory Reference Directive**: Always consult `@DESIGN.md` for design system guidelines, color tokens, layout hierarchy, and component rules, and `@prompt.md` for system architecture, schema rules, and implementation patterns.

You are an expert full-stack React & Node.js developer specialising in Next.js 16 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Prisma ORM, and Zod.

Your goal is to faithfully convert the provided monolithic static HTML file (`index.html`) — **The Global Altar Watch (TGAW)** faith-companion dashboard — into a modern, production-grade Next.js 16 application.

The migration must:

- Preserve **every UI section, interactive behaviour, and visual detail** present in `index.html`.
- Be built on a **Mobile-First API Architecture** with decoupled `/api/v1/` REST endpoints ready for native mobile clients.
- Achieve end-to-end type safety with **MongoDB Atlas + Prisma ORM + Zod schema validation**.
- Protect all dashboard routes with server-side authentication and **Role-Based Access Control (RBAC)** using **Better Auth** (configured in `lib/auth.ts`) enforcing three explicit roles: `user` (default), `admin`, and `superadmin`.

---

## 1. Tech Stack & Architecture

1. **Framework & Engine**:
   - Next.js 16 (App Router) using React 19 server/client boundaries.
   - TypeScript (`strict: true`).
   - **Database & ORM**: MongoDB Atlas connected via **Prisma ORM** (MongoDB connector).
   - **Validation & Types**: **Zod** for schema definitions, API request body/query validation, and shared TypeScript inferred types.
   - **Authentication & RBAC**: **Better Auth** (`better-auth`) with `admin` plugin enabling strict **Role-Based Access Control (RBAC)** across three explicit roles: `user` (default), `admin`, and `superadmin`. Auth is configured in `lib/auth.ts`. Route protection is handled in `proxy.ts` — **do NOT use `middleware.ts`** (deprecated in this project).
   - **Forms**: **React Hook Form** + **Zod** for all client-side form validation and submission.
   - **Styling**: Tailwind CSS v4 + CSS custom properties in `globals.css` (preserving the existing deep-purple glassmorphism design language — **do not redesign**).
   - **Fonts**: Load `Playfair Display`, `DM Sans`, `Inter`, and `JetBrains Mono` via `next/font/google`. Inject as CSS variables (`--font-playfair`, `--font-dm-sans`, `--font-inter`, `--font-jetbrains-mono`) on the `<html>` element in `app/layout.tsx`. Reference them in `globals.css` `font-family` declarations.

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
   │       └── page.tsx           # Split-panel login page (see §6)
   ├── (dashboard)/
   │   ├── layout.tsx             # Sidebar + Topbar shell, session guard
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
   │   │   ├── page.tsx           # Admin Dashboard (admin + superadmin)
   │   │   └── users/
   │   │       └── page.tsx       # User & Role Management (superadmin only)
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
   │       └── messages/
   │           ├── route.ts       # GET (list), POST
   │           └── [id]/
   │               └── route.ts   # PATCH (mark read/unread)
   ├── globals.css
   ├── layout.tsx                 # Root layout — font CSS vars, metadata
   └── page.tsx                   # Public landing page (see §5)
   actions/                       # Server actions ('use server')
   │   ├── eventActions.ts
   │   └── messageActions.ts
   components/
   ├── ui/                        # Button, Modal, Card, Toast, Badge
   ├── landing/                   # HeroSection, StatsRow, PhoneMockup, NavBar
   ├── dashboard/                 # Sidebar, Topbar, StatCard, ProgressBar
   ├── calendar/                  # MonthGrid, DaySchedule, EventForm
   ├── messages/                  # MessageList, MessageRow
   └── zoom/                      # ZoomLinkCard, ZoomQuickJoinBanner
   lib/
   ├── auth.ts                    # Better Auth config (providers, hooks, session shape)
   ├── auth-client.ts             # Better Auth client for use in client components
   ├── db/
   │   └── prisma.ts              # Prisma Client singleton
   ├── schemas/
   │   ├── eventSchema.ts         # Zod schemas + inferred types for Event
   │   └── messageSchema.ts       # Zod schemas + inferred types for Message
   ├── services/
   │   ├── eventService.ts        # Prisma query layer for events
   │   └── messageService.ts      # Prisma query layer for messages
   └── utils.ts                   # Date helpers, response formatters, error handlers
   providers/                     # React context providers (auth session, theme)
   │   └── SessionProvider.tsx
   prisma/
   └── schema.prisma              # MongoDB Atlas Prisma Schema
   proxy.ts                       # Route protection — replaces middleware.ts (see §3B)
   .env.example                   # All required env variable keys (see §9)
   ```

---

## 2. Database Schema & Validation (Prisma + Zod)

### A. Prisma Schema (`prisma/schema.prisma`)

> **MongoDB & Better Auth ID Mapping Rule**: Better Auth generates random string IDs (not 24-character hexadecimal ObjectIds). All models associated with authentication (`User`, `Account`, `Session`, `Verification`) as well as foreign keys referencing `User.id` (such as `Event.userId` and `Message.recipientId`) **MUST** use plain `String @id @map("_id")` or `String` without `@db.ObjectId`. Custom user fields created dynamically (e.g. `initials`) **MUST** be optional (`String?`) or provide `@default("")`.

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
}

model Event {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  userId    String                        // owner — plain string from session user.id
  type      EventType
  title     String
  passage   String?                       // Bible passage or prayer focus
  date      String                        // YYYY-MM-DD
  time      String                        // HH:MM (24h)
  duration  Int                           // minutes
  zoomUrl   String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  senderName       String
  avatarText       String
  avatarStyleClass String   // av1 | av2 | av3 | av4
  preview          String
  fullBody         String?
  timestamp        DateTime @default(now())
  isUnread         Boolean  @default(true)
  recipientId      String                 // target user.id
}

enum Role {
  user
  admin
  superadmin
}

model User {
  id            String    @id @map("_id")
  email         String    @unique
  passwordHash  String?
  name          String
  initials      String?
  role          Role      @default(user)
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
  profile       Profile?

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
import { z } from "zod";

export const eventTypeSchema = z.enum(["BIBLE", "PRAYER"]);

export const createEventSchema = z.object({
  type: eventTypeSchema,
  title: z.string().min(1, "Title is required"),
  passage: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)"),
  duration: z.number().int().positive(),
  zoomUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial();
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
```

### C. Prisma Client Singleton (`lib/db/prisma.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"], // Configured to log only errors to keep console output clean
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 3. Authentication & RBAC (Better Auth)

> **AGENTS.md rule**: Global `middleware.ts` is **deprecated** in this project. All request interception and route protection lives in `proxy.ts`. Do not create or modify `middleware.ts`.
> **Role system**: Three explicit roles must be enforced: `user` (default), `admin`, and `superadmin`.

### A. Better Auth Config (`lib/auth.ts`)

Configure Better Auth with the MongoDB Prisma adapter, OAuth providers, and the `admin` plugin to support role management (`user`, `admin`, `superadmin`):

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRole: ["admin", "superadmin"],
    }),
  ],
});
```

### B. Better Auth Client (`lib/auth-client.ts`)

Export a typed client with `adminClient()` plugin for use in `"use client"` components:

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

### C. Better Auth Route Handler (`app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### D. Route Protection & RBAC (`proxy.ts`)

All global request interception and RBAC guards live in `proxy.ts` — not `middleware.ts`.

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/bible",
  "/prayer",
  "/calendar",
  "/messages",
  "/worship",
  "/groups",
  "/settings",
  "/admin",
];

const ADMIN_PATHS = ["/admin"];
const SUPERADMIN_PATHS = ["/admin/users"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user.role as string) || "user";

  // RBAC Guard: SuperAdmin-only paths
  if (
    SUPERADMIN_PATHS.some((p) => path.startsWith(p)) &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // RBAC Guard: Admin & SuperAdmin paths
  if (
    ADMIN_PATHS.some((p) => path.startsWith(p)) &&
    !["admin", "superadmin"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}
```

### E. Reading the Session & Roles (Server Components & Actions)

In server components, route handlers, and server actions, verify session and roles using helper utilities:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(
  allowedRoles: ("user" | "admin" | "superadmin")[],
) {
  const session = await requireAuth();
  const role = (session.user.role as "user" | "admin" | "superadmin") || "user";
  if (!allowedRoles.includes(role)) redirect("/unauthorized");
  return session;
}
```

### F. Role Permission Matrix

| Role         | Access Scope & Permissions                                                                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`       | **Default role.** Access to personal faith dashboard (`/bible`, `/prayer`, `/calendar`, `/messages`, `/worship`, `/groups`, `/settings`). Cannot access `/admin`.                              |
| `admin`      | All `user` privileges + access to Admin Portal (`/admin`): manage community announcements, broadcast messages, view global member directory. Cannot modify user roles or system configuration. |
| `superadmin` | All `admin` privileges + access to User & Role Management (`/admin/users`): promote/demote user roles (`user`, `admin`, `superadmin`), ban/unban users, configure global system settings.      |

---

## 4. API Handler Pattern (`app/api/v1/events/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createEventSchema } from "@/lib/schemas/eventSchema";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 },
    );

  const body = await req.json();
  const validation = createEventSchema.safeParse(body);
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 },
    );

  const event = await prisma.event.create({
    data: { ...validation.data, userId: session.user.id! },
  });
  return NextResponse.json({ success: true, data: event }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 },
    );

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  const type = searchParams.get("type"); // BIBLE | PRAYER

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id!,
      ...(date ? { date } : {}),
      ...(type ? { type: type as "BIBLE" | "PRAYER" } : {}),
    },
    orderBy: { time: "asc" },
  });
  return NextResponse.json({ success: true, data: events });
}
```

---

## 5. Public Landing Page (`app/page.tsx`)

Recreate the **full** marketing landing page from `index.html` (`#landing` section). It is a **server component** (no interactivity beyond the nav CTA links).

### Must include all of these elements:

1. **Navigation bar** (`<nav>`):
   - Left: TGAW logo (`TGA` + `W` in accent red).
   - Right: Links — Features, About, Community — and a **Sign In** primary button linking to `/login`.
   - On mobile (`< 900 px`), hide nav links; show only the Sign In button.

2. **Hero section** (two-column layout, stacks on mobile):
   - Left: Badge pill ("Your Daily Faith Companion"), `<h1>` with italic purple highlight, subtitle paragraph, two CTAs (Get Started Free → `/login`, Sign In → `/login`).
   - Right: **Phone mockup card** — a floating glassmorphism card (280 px wide) displaying:
     - Header: "Today's Plan" + avatar initials.
     - Verse of the Day preview box (Jer 29:11).
     - Three schedule slot rows (Morning Reading · John 3 · 6:00 AM · 30 min; Morning Prayer · Intercession · 7:00 AM · 20 min; Evening Study · Psalms 23 · 8:00 PM · 45 min).
   - Two **floating badge chips** positioned absolutely: "🔥 Streak — 21 Days" (top-left of card) and "✅ Completed — 12 This Week" (bottom-right).

3. **Animated background**:
   - Three blurred radial orbs (`.orb1`, `.orb2`, `.orb3`) with a gentle `float` keyframe (`translateY 0 → -30px`, 8 s infinite).
   - SVG fractal noise grain overlay (fixed, `pointer-events: none`, `opacity: 0.6`).

4. **Stats row** (bottom of landing, full-width glass bar, responsive: 2 columns on mobile):
   - 50K+ Active Believers
   - 1.2M Prayer Sessions Logged
   - 66 Books of the Bible Covered
   - 98% Member Satisfaction

---

## 6. Login Page (`app/(auth)/login/page.tsx`)

Recreate the **split-panel** login page from `index.html` (`#login` section).

### Layout (side-by-side on desktop, single column on mobile):

**Left panel** (`login-art`) — decorative, hidden on mobile:

- Dark purple gradient background with a blurred radial circle.
- Centred quote block: large decorative `"` mark in accent red, italic scripture quote ("Your word is a lamp to my feet…"), citation ("— Psalm 119:105").

**Right panel** (`login-form-wrap`, 480 px fixed, full-width on mobile):

- TGAW logo.
- `<h2>` "Welcome back" + sub-text "Continue your faith journey".
- Email input field.
- Password input field.
- "Forgot password?" link (right-aligned, `/forgot-password` stub).
- Full-width primary **Sign In to TGAW** button — calls `authClient.signIn.email({ email, password })` from `lib/auth-client.ts`.
- Divider ("or continue with").
- One social button: 🐙 GitHub (`authClient.signIn.social({ provider: "github" })`).
- "Don't have an account? Create one free →" link (stub, `/register`).
- "← Back to home" link → `/`.

**Validation**: Use **React Hook Form** + **Zod** for field-level validation. Show inline error messages beneath each field. Display server errors (e.g. wrong credentials) as a banner above the form.

---

## 7. Dashboard Layout (`app/(dashboard)/layout.tsx`)

This is a **server component** that:

1. Calls `auth.api.getSession({ headers: await headers() })` and redirects to `/login` if no session.
2. Passes `session.user` (name, email, role) to child client components.
3. Renders the outer `<div style="display:flex; min-height:100vh">` shell containing `<Sidebar>` and `<main>`.

### Sidebar (`components/dashboard/Sidebar.tsx`) — client component:

Faithfully reproduce the sidebar from `index.html`:

- Logo at top.
- **Section labels** + **nav items** exactly as in HTML:
  - Overview section: Dashboard, Progress
  - Devotion section: Calendar, Bible Reading, Prayer, Praise & Worship
  - Community section: Messages (with unread count badge), Groups
  - Account section: Settings, Sign Out
  - **Admin section** (conditionally rendered for `admin` and `superadmin` roles only):
    - Admin Portal (`/admin` — 🛡️ icon)
    - User Management (`/admin/users` — 👑 icon, rendered only when `role === 'superadmin'`)
- Each item navigates to its route using `<Link>` from `next/link`. Active item highlighted with `border-left: 3px solid var(--red-soft)` + purple background tint.
- **Unread badge** on Messages: fetched server-side and passed as prop; re-validates on message read.
- Footer: user avatar (gradient circle with initials), name, role + streak.

**Mobile behaviour**:

- On `< 900 px`, sidebar starts off-screen (`translateX(-260px)`) with `transition: transform 0.3s ease`.
- **Hamburger button** (3-bar icon, top-left of topbar) toggles a React state `sidebarOpen`.
- A dark overlay backdrop (`position: fixed; inset: 0; background: rgba(0,0,0,0.5)`) renders when sidebar is open; clicking it closes the sidebar.
- `useState` + `useEffect` to add/remove `overflow: hidden` on `<body>` when sidebar is open.

### Topbar (`components/dashboard/Topbar.tsx`) — client component:

- Hamburger toggle (mobile only).
- Dynamic page title (driven by current route using `usePathname()`).
- Right actions: Messages icon (with red dot) → `/messages`; Bell icon (with red dot); Avatar button.

---

## 8. Page Implementations

### 8.1 Overview Page (`app/(dashboard)/page.tsx`)

This is a **server component** that fetches today's events and passes them to client components.

**Must render:**

1. **Greeting** (client component to avoid hydration mismatch):
   - Time-of-day salutation: "Good morning" (5–11), "Good afternoon" (12–16), "Good evening" (17–21), "Good night" (22–4).
   - User's first name from session.
   - Dynamic date: `Monday, 16 March 2026` format.
   - Session count: "You have N sessions scheduled today" (N from today's event count).

2. **Verse of the Day banner**: Display a rotating verse from a curated local array (minimum 30 entries). Include a Share button (copies verse text to clipboard).

3. **Zoom Quick-Join Banner** (`components/zoom/ZoomQuickJoinBanner.tsx`):
   - Shows the most imminent event (within the next 2 hours) that has a `zoomUrl`.
   - Displays: event title, Live Now / Starting Soon status chip, Meeting ID + Passcode (parsed from the URL or stored separately), Host name.
   - Actions: "📋 Copy Link" button, "▶ Join Now" `<a target="_blank">` button.
   - Hidden when no qualifying event exists.

4. **4 Stat cards** (data from API or session):
   - Day Streak (from `session.user.streakDays`)
   - Chapters Read (from aggregated events this month)
   - Prayer Sessions (from aggregated events this month)
   - Total Time (sum of durations)

5. **2-column grid**:
   - Today's Schedule panel: list of today's events (fetched from `/api/v1/events?date=<today>`), each row showing time, colour bar (purple=bible, red=prayer), event name, subtext, and status chip (Done/Now/Upcoming).
   - Weekly Progress panel: 5 progress bars (Bible Reading Plan, Prayer Goal, New Testament, Old Testament, Community Engagement) — values computed from event data.

6. **Wide panel**: Recent Messages preview (last 4 messages from `/api/v1/messages?limit=4`).

---

### 8.2 Bible Reading Page (`app/(dashboard)/bible/page.tsx`)

1. **3 stat cards**: Sessions This Week, Total Reading Time, Chapters Completed.

2. **Zoom Meeting Links panel** (`components/zoom/ZoomLinkCard.tsx`):
   - Renders all events of type `BIBLE` that have a `zoomUrl`.
   - Each card shows: icon, session name, schedule text, the URL as a truncated link, status chip (Live Now / Starting Soon — computed from event time), Copy and Join actions.

3. **Today's Reading Sessions panel**: Events of type `BIBLE` for today.

4. **This Week's Reading Plan panel**: Events of type `BIBLE` for the current ISO week.

---

### 8.3 Prayer Page (`app/(dashboard)/prayer/page.tsx`)

Mirror of Bible Reading page with `type=PRAYER` data. Includes:

1. **3 stat cards**: Sessions This Month, Total Prayer Time, Consistency Rate.
2. **Zoom Meeting Links panel** — all prayer events with Zoom URLs.
3. **Today's Prayer Schedule** panel.
4. **Weekly Prayer Patterns** panel — progress bars by prayer category (Intercession, Thanksgiving, Supplication, Worship Prayer).

---

### 8.4 Calendar Page (`app/(dashboard)/calendar/page.tsx`) — client component

This is the most complex interactive page. Implement every behaviour from `index.html`:

#### Left column — Month grid + Day schedule:

1. **Month grid** (`components/calendar/MonthGrid.tsx`):
   - Display a 7-column calendar grid for the current month.
   - Navigation: `‹` / `›` buttons call `changeMonth(-1)` / `changeMonth(1)`.
   - Each day cell:
     - `today` class: purple tint + purple-glow border.
     - `selected` class: red gradient + shadow.
     - `has-events` + dot indicator below the number:
       - Bible-only: purple-glow dot.
       - Prayer-only: red-soft dot.
       - Both: gradient dot.
   - Clicking a day sets it as `selectedDate` and populates the date field in the Add Event form.
   - Top-right: timezone badge showing local time + timezone abbreviation (use `Intl.DateTimeFormat().resolvedOptions().timeZone`).

2. **Day schedule panel** (`components/calendar/DaySchedule.tsx`):
   - Title: "Events on [selected date formatted as 'Wednesday, 16 Mar 2026']".
   - Lists all events for the selected date sorted by time.
   - Each event row: coloured dot, event name + passage/focus, time (12h), duration, optional "▶ Zoom" badge if `zoomUrl` exists.
   - **Delete button**: appears on hover (`opacity: 0 → 1`); calls `DELETE /api/v1/events/[id]` and removes from local state optimistically.
   - Empty state: 📭 icon + "No sessions scheduled" message.

#### Right column — Add Event form (`components/calendar/EventForm.tsx`):

Sticky panel that calls `POST /api/v1/events` on submit:

| Field                        | Control                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| Session Type                 | Toggle buttons: 📖 Bible Reading / 🙏 Prayer                  |
| Session Title                | Text input                                                    |
| Bible Passage / Prayer Focus | Text input (label changes based on type)                      |
| Date                         | `<input type="date">` (pre-filled from selected calendar day) |
| Start Time                   | `<input type="time">`                                         |
| Duration                     | `<select>` (10 / 15 / 20 / 25 / 30 / 45 / 60 / 90 / 120 min)  |
| Your Time Zone               | Read-only display (auto-detected, purple-tinted box)          |
| Zoom Meeting Link            | `<input type="url">` (optional)                               |
| Notes                        | `<textarea>` (optional)                                       |

- On success: add event to local state, re-render calendar grid dots, show **toast notification** ("✦ Session added to your calendar!") that auto-dismisses after 3 s.
- On error: show inline field-level error messages from the API's Zod error response.

---

### 8.5 Messages Page (`app/(dashboard)/messages/page.tsx`)

**Initial data** loaded server-side from `GET /api/v1/messages` (filtered by `recipientId = session.user.id`).

**Inbox list** (`components/messages/MessageList.tsx`) — client component:

- Each row (`MessageRow`): gradient avatar circle with initials, sender name, preview text (truncated), timestamp.
- **Unread rows**: purple-tinted background + red dot in sender name row.
- **Click to read**: calls `PATCH /api/v1/messages/[id]` with `{ isUnread: false }`, removes unread styling and dot optimistically. Updates the sidebar badge count via a shared React context or a server action revalidation.
- Sidebar unread badge re-fetches/revalidates on read.
- "Compose →" button: stub — shows a disabled state or a "Coming Soon" modal for now.

---

### 8.6 Stub Pages (Praise & Worship, Groups, Settings)

For each of `worship/`, `groups/`, and `settings/`, create a minimal page that:

- Shows the page heading in the same Playfair Display style.
- Renders a single glassmorphism card with a "Coming Soon" message and a brief description of the planned feature.
- Does **not** show a 404 or error.

---

### 8.7 Admin Portal & RBAC Pages

#### A. Admin Dashboard (`app/(dashboard)/admin/page.tsx`)

Accessible to `admin` and `superadmin` users. Renders:

- Stat cards: Total Active Members, Community Announcements Published, Flagged Content.
- Announcement Broadcast tool: compose a global message sent to all users.
- Quick link to User Management (visible to `superadmin` only).

#### B. User & Role Management (`app/(dashboard)/admin/users/page.tsx`)

Accessible to `superadmin` users only (`requireRole(["superadmin"])`). Renders:

- User management table with search and role filter (`user`, `admin`, `superadmin`).
- Each user row displays: Name, Email, Current Role badge, Streak count, Created date.
- **Role Assignment Dropdown**: Allows changing a user's role (`user` ↔ `admin` ↔ `superadmin`) via Better Auth's `authClient.admin.setRole({ userId, role })` or Server Action.
- **Ban / Unban Action**: Toggle user ban status using `authClient.admin.banUser` / `unbanUser`.

#### C. Access Denied Page (`app/(dashboard)/unauthorized/page.tsx`)

Rendered when a user attempts to access a route restricted by RBAC (e.g. standard `user` accessing `/admin`):

- Clean glassmorphism 403 card with warning icon ("🔒 Access Denied").
- Heading: "Authorisation Required".
- Text: "Your account role does not have permission to view this page."
- CTA button: "← Return to Dashboard" (`/`).

---

## 9. Design System & UI/UX Specification (`DESIGN.md` Integration)

### A. Design Tokens

```yaml
colors:
  primary: "#000000"
  secondary: "#94A3B8"
  accent: "#94A3B8"
  background: "#000000"
  surface: "#94A3B8"
  text-primary: "#FFFFFF"
  text-secondary: "#A1A1AA"
  border: "#CBD5E1"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: "1.04"
    letterSpacing: "0"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  label-md:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "1.2"
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
  section-padding: "80px"
rounded:
  card: "14px"
  control: "14px"
  pill: "9999px"
components:
  card:
    background: "Use surface token with subtle borders and HTML-matched shadow depth"
    radius: "Match declared card radius token (14px)"
  button:
    background: "Use primary or accent colors for main action"
    radius: "Use control (14px) or pill (9999px) radius based on source HTML"
```

### B. CSS Custom Properties (`globals.css`)

```css
:root {
  /* DESIGN.md Tokens */
  --color-primary: #000000;
  --color-secondary: #94A3B8;
  --color-accent: #94A3B8;
  --color-background: #000000;
  --color-surface: #94A3B8;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A1A1AA;
  --color-border: #CBD5E1;

  /* Spacing Tokens */
  --spacing-base: 8px;
  --spacing-gap: 16px;
  --spacing-card-padding: 24px;
  --spacing-section-padding: 80px;

  /* Radius Tokens */
  --radius-card: 14px;
  --radius-control: 14px;
  --radius-pill: 9999px;

  /* TGAW Glassmorphic Theme Extensions */
  --purple-deep: #1a0533;
  --purple-mid: #4b1d8e;
  --purple-light: #7c3fd6;
  --purple-glow: #9b59f5;
  --red: #d02040;
  --red-soft: #e84060;
  --white: #ffffff;
  --off-white: #f5f0ff;
  --muted: #c5b8e0;
  --glass: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.12);
  --card-bg: rgba(75, 29, 142, 0.25);

  /* Fonts */
  --font-inter: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
  --font-playfair: var(--font-playfair);
  --font-dm-sans: var(--font-dm-sans);
}
```

### C. Layout, Composition & Component Rules

1. **Composition & Hierarchy**:
   - Preserve visible hierarchy, first-screen composition, section rhythm, max-width behavior, and responsive stacking from the source.
   - Dashboard, chart, and data panels must preserve compact operational hierarchy, nested surfaces, and metric emphasis.

2. **Styling & Radius Standards**:
   - **Cards**: `background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-card); backdrop-filter: blur(8px); padding: var(--spacing-card-padding)`.
   - **Glass Buttons**: `background: var(--glass); border: 1.5px solid var(--glass-border); border-radius: var(--radius-control); backdrop-filter: blur(8px)`.
   - **Pill Badges & Buttons**: `border-radius: var(--radius-pill)`.
   - **Primary Buttons**: `background: linear-gradient(135deg, var(--red), var(--red-soft)); box-shadow: 0 6px 28px rgba(208,32,64,0.4); border-radius: var(--radius-control)`. Hover: `translateY(-2px); opacity: 0.92`.
   - **Input Focus**: `border-color: var(--purple-glow); background: rgba(124,63,214,0.1); border-radius: var(--radius-control)`.
   - **Sidebar Active Item**: `border-left: 3px solid var(--red-soft); background: rgba(124,63,214,0.15)`.

3. **Motion & WebGL Effects**:
   - Preserve existing motion cues: masked reveals, staggered entrances, hover lifts (`translateY(-2px)`), scroll-triggered transitions, and ambient movement. Keep easing smooth and restrained.
   - Rebuild canvas, WebGL, Three.js, gradient particle, or atmospheric effects as supporting background layers behind content (`pointer-events: none`). Keep effects performant and responsive.

4. **Design Guardrails**:
   - Do not flatten source structures into generic SaaS card grids.
   - Do not swap color mode unless explicitly requested/supported.
   - Preserve first viewport focal object and visual density.
   - Align all buttons, cards, and badges to exact radius (`14px` / `9999px`) and border language.

### D. Hydration Safety

All computations that depend on current time, local timezone, or `window` APIs must be isolated in `"use client"` components with `useEffect` to avoid hydration mismatches. Never render time-dependent strings in server components directly.

### E. Responsive Breakpoints

| Breakpoint | Changes                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| `< 1100px` | Stat cards: 2 columns                                                                 |
| `< 900px`  | Sidebar off-canvas (hamburger); hero stacks; login art hidden; topbar padding reduced |
| `< 580px`  | Stat cards: 2 col; verse banner stacks; message preview truncated                     |
| `< 380px`  | Stat cards: 1 col                                                                     |

---

## 10. Environment Variables (`.env.example`)

Create this file as `.env.example` at the project root. Store actual secrets in `.env.local`. Do **not** commit `.env.local`.

```bash
# MongoDB Atlas
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"

# Better Auth
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"   # public base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email (Resend + React Email)
BETTER_AUTH_EMAIL="noreply@tgaw.app"
RESEND_API_KEY=""

# (Optional) Bible API — if using external verse-of-the-day
BIBLE_API_KEY=""
```

---

## 11. Execution Checklist

Use `bun` / `bunx` for all package and runtime commands — not `npm` / `npx`.

1. **Prisma schema**: Paste schema into `prisma/schema.prisma`. Set `DATABASE_URL` in `.env.local`. Run `bunx prisma db push` then `bunx prisma generate`.
2. **Better Auth**: Install `better-auth` and `better-auth/adapters/prisma`. Configure `lib/auth.ts` (already started). Create `lib/auth-client.ts`. Wire `app/api/auth/[...all]/route.ts`.
3. **`proxy.ts`**: Add dashboard route protection per §3D. **Do not create `middleware.ts`**.
4. **`globals.css`**: Define all CSS variables, base resets, utility classes, and keyframe animations.
5. **Font injection**: Configure `next/font/google` in `app/layout.tsx`, inject as CSS variables.
6. **Zod schemas**: Create `lib/schemas/eventSchema.ts` and `messageSchema.ts`.
7. **API routes**: Implement `/api/v1/events` and `/api/v1/messages` using `auth.api.getSession` for auth checks.
8. **Server actions**: Create `actions/eventActions.ts` and `actions/messageActions.ts` with `'use server'` directive.
9. **Landing page**: Build `app/page.tsx` per §5.
10. **Login page**: Build `app/(auth)/login/page.tsx` per §6 (React Hook Form + Zod + `authClient`).
11. **Dashboard layout**: Build sidebar (with conditional Admin section based on role) + topbar per §7.
12. **Overview page**: Build per §8.1.
13. **Bible & Prayer pages**: Build per §8.2 and §8.3.
14. **Calendar page**: Build full interactive calendar per §8.4.
15. **Messages page**: Build inbox with read/unread per §8.5.
16. **Stub pages**: Create Worship, Groups, Settings per §8.6.
17. **Admin & RBAC pages**: Create `/admin/page.tsx`, `/admin/users/page.tsx`, and `/unauthorized/page.tsx` per §8.7.
18. **`.env.example`**: Populate per §10.
19. **Verify**: Run `bun run dev`. Confirm all routes, interactions, and RBAC guards (`user` vs `admin` vs `superadmin`) work properly. Confirm responsive breakpoints match `index.html`. Run `bun run check` (Biome) before committing.

---

## 12. SVG Accessibility & Linting (`no-svg-without-title`)

All `<svg>` elements must comply with Biome's `noSvgWithoutTitle` rule to ensure accessibility:

1. **Decorative or Icon SVGs** (e.g. accompanied by `<span className="sr-only">Label</span>` or purely visual icons):
   - Add `aria-hidden="true"` to the `<svg>` element.
   ```tsx
2. **Standalone or Informative SVGs**:
   - Must include a descriptive `<title>` element inside the `<svg>`, and/or `aria-label` / `aria-labelledby`.
   ```tsx
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-label="Apple logo">
     <title>Apple logo</title>
     ...
   </svg>
   ```

3. **Image Alt Text Guidelines (`noRedundantAlt`)**:
   - Avoid generic or redundant words like `"image"`, `"picture"`, or `"photo"` in `alt` text attributes (e.g. `alt="Image"`). Screen readers already announce `<img>` elements as images, so adding those words is repetitive.
   - Always provide concise, descriptive `alt` text describing what the image represents (e.g. `alt="Christ The Redeemer"`).



