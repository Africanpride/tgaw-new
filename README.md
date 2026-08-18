<p align="center">
  <img src="public/favicon.ico" width="64" height="64" alt="TGAW Logo" />
</p>

<h1 align="center">The Global Altar Watch (TGAW)</h1>

<p align="center">
  A modern Christian community platform for daily devotion, prayer, Bible reading, and fellowship with believers worldwide.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#role-based-access">RBAC</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io" alt="Socket.IO" />
</p>

---

## Overview

**TGAW** is a premium, mobile-first social platform built for the global Christian community. It provides tools for Bible reading, prayer coordination, praise & worship, community messaging, event scheduling, and content sharing — all backed by real-time communication and a robust role-based access system.

The application is built with a **decoupled REST API architecture** (`/api/v1/*`), making it ready for future native mobile clients (iOS / Android) while serving a polished Next.js web experience today.

---

## Features

### 🙏 Devotional & Booking System
- **Slot Booking** — Daily 30-minute slots for Bible reading, Prayer, and Praise & Worship with configurable limits per user per day
- **Meeting Links** — Admin-managed Zoom/MS Teams links attached to each slot type per day
- **Booking Calendar** — Interactive mini calendar for browsing and booking available slots
- **Slot Timeline** — Visual timeline view of booked/available slots per day

### 💬 Real-Time Communication
- **Direct Messages** — 1-on-1 conversations between community members
- **Group Chat** — Real-time messaging within groups via Socket.IO
- **Conversations** — Unified inbox with read receipts and attachment support
- **Admin Broadcasts** — System-wide announcements from leadership

### 📝 Content & Social
- **Rich Post Types** — Text, media, links, polls, Bible verses, quotes, sermons, gospel tracts, articles, prayer requests/answers, testimonials, and praise reports
- **Social Graph** — Follow/unfollow users, like posts and comments
- **Moderation** — Content reporting and moderation queue for leadership
- **Polls** — Community polls with real-time vote tallying

### 📅 Calendar & Events
- **Event Scheduling** — Create and manage Bible, Prayer, and Praise & Worship events
- **Interactive Calendar** — Full calendar view with day/week/month navigation
- **iCal Feed** — Per-user iCal export for external calendar integration

### 🔔 Notifications
- **Email** — SMTP-based email notifications via Nodemailer
- **Web Push** — VAPID-based push notifications with service worker support
- **Multi-Channel Dispatch** — Configurable notification routing per event type

### 👥 Groups & Community
- **Group Management** — Create public/private groups with member roles (member, moderator, owner)
- **Group Conversations** — Dedicated chat channels per group

### 🛡️ Administration
- **User Management** — Superadmin user/role management panel
- **Coordinator Dashboard** — Timezone-scoped view for coordinators
- **Board Dashboard** — Organization-wide insights for board members
- **Booking Configuration** — Admin controls for slot limits and visibility modes
- **Moderation Queue** — Review and resolve reported content

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript (`strict: true`) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Lucide Icons) |
| **Styling** | Tailwind CSS v4 with HSL semantic tokens |
| **Animation** | [Motion](https://motion.dev/) (motion/react) |
| **Database** | MongoDB Atlas |
| **ORM** | [Prisma](https://www.prisma.io/) (MongoDB connector) |
| **Validation** | [Zod v4](https://zod.dev/) |
| **Auth** | [Better Auth](https://www.better-auth.com/) with admin plugin |
| **Forms** | React Hook Form + `@hookform/resolvers/zod` |
| **Real-time** | Socket.IO (custom Node HTTP server) |
| **Media** | Cloudinary (signed uploads) |
| **Email** | Nodemailer (SMTP) |
| **Push** | Web Push (VAPID) |
| **Runtime** | Node.js with tsx |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Bun** (package manager, recommended) or npm
- **MongoDB Atlas** cluster ([free tier available](https://www.mongodb.com/atlas))

### 1. Clone & Install

```bash
git clone https://github.com/Africanpride/tgaw-new.git
cd tgaw-new
bun install
```

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Key variables to configure:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `BETTER_AUTH_SECRET` | Auth secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `SUPERADMIN_EMAILS` | Comma-separated emails auto-assigned superadmin on signup |
| `MICROSOFT_CLIENT_ID/SECRET` | Microsoft OAuth provider |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth provider |
| `SMTP_HOST/PORT/USER/PASS` | Email notification transport |
| `CLOUDINARY_*` | Media storage credentials |
| `VAPID_*` | Web Push VAPID keys |
| `CRON_SECRET` | Protects `POST /api/v1/slots/generate` |

### 3. Generate Prisma Client

```bash
bunx prisma generate
```

### 4. Start Development Server

```bash
bun run dev
```

The app starts on **http://localhost:3000** with a custom Node server that bundles Next.js + Socket.IO on the same HTTP process.

### 5. Promote a Superadmin

After your first user signs up, promote them to superadmin:

```bash
bun run set-superadmin
```

---

## Project Structure

```
tgaw-new/
├── app/
│   ├── (auth)/                  # Login, signup, forgot-password routes
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── overview/            # Home dashboard
│   │   ├── bible/               # Bible reading slots + Zoom links
│   │   ├── prayer/              # Prayer slots + Zoom links
│   │   ├── worship/             # Praise & Worship dashboard
│   │   ├── booking/             # Slot booking UI
│   │   ├── calendar/            # Interactive calendar & scheduler
│   │   ├── messages/            # Community messages inbox
│   │   ├── feed/                # Social feed
│   │   ├── groups/              # Groups management
│   │   ├── notifications/       # Notification center
│   │   ├── settings/            # Account settings
│   │   ├── admin/               # Admin portal (leader + superadmin)
│   │   ├── coordinator/         # Timezone-scoped coordinator dashboard
│   │   ├── board/               # Org-wide board dashboard
│   │   └── unauthorized/        # 403 access denied page
│   ├── (onboarding)/            # Post-signup profile setup
│   ├── (public)/                # Public-facing pages
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth catch-all handler
│   │   └── v1/                  # REST API endpoints
│   │       ├── account/         # Account management
│   │       ├── admin/           # Admin operations
│   │       ├── bookings/        # Event bookings
│   │       ├── calendar/        # Calendar & iCal feeds
│   │       ├── events/          # CRUD events
│   │       ├── groups/          # Groups & membership
│   │       ├── messages/        # Messaging
│   │       ├── posts/           # Posts, comments, likes
│   │       ├── profile/         # User profiles
│   │       ├── reports/         # Content reports
│   │       ├── slots/           # Slot booking system
│   │       ├── uploads/         # Signed upload params
│   │       ├── users/           # User management
│   │       └── verse/           # Bible verse API
│   ├── globals.css              # shadcn HSL / CSS variable tokens
│   ├── layout.tsx               # Root layout (fonts, providers)
│   └── page.tsx                 # Public landing page
│
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── auth/                    # Auth-related components
│   ├── blocks/                  # Composed layout blocks
│   ├── booking/                 # Booking calendar, slot grid, timeline
│   ├── calendar/                # Calendar view components
│   ├── dashboard/               # Dashboard stat cards, progress bars
│   ├── landing/                 # Landing page sections
│   ├── messages/                # Message list and row components
│   ├── onboarding/              # Onboarding flow components
│   ├── verse/                   # Bible verse display
│   └── zoom/                    # Zoom link cards
│
├── lib/
│   ├── auth.ts                  # Better Auth config (providers, hooks, session)
│   ├── auth-client.ts           # Better Auth client for client components
│   ├── db/prisma.ts             # Prisma Client singleton
│   ├── schemas/                 # Zod schemas + inferred types
│   ├── services/                # Prisma query layer (data access)
│   ├── socket/                  # Socket.IO server & client setup
│   ├── storage/                 # Cloudinary config + upload helpers
│   ├── notifications/           # Email, push, dispatch helpers
│   └── utils.ts                 # Shared utilities (cn, date helpers)
│
├── actions/                     # Server actions ('use server')
├── providers/                   # React context providers (Session, Socket)
├── hooks/                       # Custom React hooks
├── config/                      # App configuration
├── prisma/
│   └── schema.prisma            # MongoDB Prisma schema (30+ models)
├── scripts/
│   ├── set-superadmin.ts        # Promote a user to superadmin
│   └── list-users.ts            # List all users
├── public/                      # Static assets
├── server.ts                    # Custom Node server (Next.js + Socket.IO)
├── proxy.ts                     # Route protection (replaces middleware.ts)
└── package.json
```

---

## API Reference

All API endpoints live under `/api/v1/` and follow a standardized response format:

```json
{
  "success": true,
  "data": { "..." },
  "error": null
}
```

### Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| **Slots & Booking** ||||
| `GET` | `/api/v1/slots` | List slots (filterable by date, type) | ✅ |
| `POST` | `/api/v1/slots/book` | Book an available slot | ✅ |
| `POST` | `/api/v1/slots/cancel` | Cancel your booking | ✅ |
| `POST` | `/api/v1/slots/generate` | Generate slots for a date range | 🔑 Leader |
| `POST` | `/api/v1/slots/assign` | Assign a slot to a user | 🔑 Leader |
| `POST` | `/api/v1/slots/admin-cancel` | Admin cancel a booking | 🔑 Leader |
| `GET/PUT` | `/api/v1/slots/config` | Get/update booking configuration | 🔑 Leader |
| `GET/POST/DELETE` | `/api/v1/slots/meeting-link` | Manage meeting links | 🔑 Leader |
| **Events** ||||
| `GET` | `/api/v1/events` | List events (filter by date & type) | ✅ |
| `POST` | `/api/v1/events` | Create an event | ✅ |
| `GET/PUT/DELETE` | `/api/v1/events/[id]` | Single event CRUD | ✅ |
| **Posts** ||||
| `GET` | `/api/v1/posts` | Feed (paginated) | ✅ |
| `POST` | `/api/v1/posts` | Create a post | ✅ |
| `GET/DELETE/PATCH` | `/api/v1/posts/[id]` | Single post operations | ✅ |
| `POST/GET` | `/api/v1/posts/[id]/comments` | Comments on a post | ✅ |
| `POST/DELETE` | `/api/v1/posts/[id]/likes` | Like/unlike a post | ✅ |
| **Messages** ||||
| `GET` | `/api/v1/messages` | List conversations | ✅ |
| `POST` | `/api/v1/messages` | Send a message | ✅ |
| `PATCH` | `/api/v1/messages/[id]` | Mark read/unread | ✅ |
| **Groups** ||||
| `GET` | `/api/v1/groups` | List groups | ✅ |
| `POST` | `/api/v1/groups` | Create a group | ✅ |
| `GET/POST/DELETE` | `/api/v1/groups/[id]/members` | Group membership | ✅ |
| **Reports** ||||
| `GET` | `/api/v1/reports` | Open moderation queue | 🔑 Leader |
| `POST` | `/api/v1/reports` | File a content report | ✅ |
| **Uploads** ||||
| `POST` | `/api/v1/uploads/sign` | Get signed Cloudinary upload params | ✅ |
| **Calendar** ||||
| `GET` | `/api/v1/calendar/ical` | Per-user iCal feed | 🔑 Token |
| **Admin** ||||
| `GET/POST` | `/api/v1/admin/*` | Admin operations | 🔑 Leader |
| `GET/PATCH` | `/api/v1/users/*` | User management | 🔑 Superadmin |

> **Legend:** ✅ = any authenticated user · 🔑 = role-gated (see RBAC below)

---

## Role-Based Access

TGAW enforces a **five-tier role system** via Better Auth with the admin plugin. Route protection is handled server-side in [`proxy.ts`](proxy.ts):

| Role | Level | Access |
|---|---|---|
| `member` | Default | Feed, chat, groups, booking, devotion pages |
| `coordinator` | +1 | Timezone-scoped coordinator dashboard (`/coordinator`) |
| `board` | +2 | Organization-wide board dashboard (`/board`) |
| `leader` | +3 | Admin portal, slot management, moderation (`/admin`) |
| `superadmin` | +4 | Full access — user & role management (`/admin/users`) |

**Key behaviors:**
- `superadmin` bypasses all RBAC checks
- Banned users are redirected to `/banned` on every request
- Users without a completed profile are redirected to `/onboarding`
- Authenticated users are redirected away from login/signup pages

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server (Next.js + Socket.IO) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run set-superadmin` | Promote a user to superadmin role |

---

## Real-Time Architecture

TGAW uses a **custom Node.js HTTP server** ([`server.ts`](server.ts)) that serves both the Next.js application and a Socket.IO server on the same process and port:

```
┌─────────────────────────────────────┐
│           HTTP Server (:3000)       │
│                                     │
│  ┌──────────┐    ┌───────────────┐  │
│  │ Next.js  │    │  Socket.IO    │  │
│  │ Handler  │    │  /socket.io   │  │
│  └──────────┘    └───────────────┘  │
│                                     │
│  Auth middleware on Socket.IO       │
│  validates session before connect   │
└─────────────────────────────────────┘
```

**Socket events:**
- `conversation:join` — Join a conversation room
- `conversation:leave` — Leave a conversation room
- `message:send` → `message:new` — Real-time message broadcast

---

## Database Schema

The Prisma schema defines **30+ models** organized across these domains:

| Domain | Models |
|---|---|
| **Auth** | `User`, `Session`, `Account`, `Verification` |
| **Profile** | `UserProfile` |
| **Events** | `Event`, `EventBooking` |
| **Slots** | `Slot`, `MeetingLink`, `BookingConfig` |
| **Messaging** | `Conversation`, `Message` |
| **Groups** | `Group`, `GroupMember` |
| **Content** | `Post`, `Comment`, `Like`, `Poll`, `PollOption` |
| **Social** | `Follow` |
| **Notifications** | `Notification`, `PushSubscription` |
| **Moderation** | `Report`, `Broadcast` |
| **Admin** | `CoordinatorAssignment` |

See the full schema: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the project conventions:
   - Use **shadcn/ui** semantic tokens — never ad-hoc hex colors
   - Validate all API inputs with **Zod** `.safeParse()`
   - Keep components in the appropriate directory under `components/`
   - Use **Prisma** service layer (`lib/services/`) for data access
4. Run checks before committing:
   ```bash
   bun run typecheck
   bun run lint
   bun run format
   ```
5. Submit a pull request

---

## License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ for the global body of Christ
</p>
