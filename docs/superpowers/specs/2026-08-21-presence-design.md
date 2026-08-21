# Presence ("Who's Online") — Design

**Date**: 2026-08-21
**Status**: Approved direction — planned, not yet implemented
**Hosting reality**: **Vercel (serverless)**. This invalidates any in-memory /
Socket.IO-based presence approach (`server.ts` cannot hold WebSocket
connections on serverless functions). Presence must not depend on it.

## Chosen approach: DB-backed heartbeat

Each signed-in client periodically "checks in"; being online simply means
"checked in recently". No sockets, no extra services, works natively with
Vercel functions + MongoDB Atlas.

### Data model (`prisma/schema.prisma`)

```prisma
model Presence {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @unique
  lastSeenAt DateTime @updatedAt

  @@index([lastSeenAt])
}
```

A raw MongoDB **TTL index** on `lastSeenAt` (`expireAfterSeconds: 300`) lets
Atlas auto-delete stale rows — "online" == row exists. No cleanup cron.

### API (`app/api/v1/presence/`)

| Route | Method | Behaviour |
|---|---|---|
| `/heartbeat` | POST | Auth-required upsert of caller's `lastSeenAt`. Returns `{ ok: true }`. Idempotent, ~1 write. |
| `/` | GET | Auth-required list of online users (id, name, initials, image). Two queries (Presence → User), no N+1. |

Standard `{ success, data, error }` envelope; Zod not needed (no body).

### Client

- `<PresenceHeartbeat />` (client component, mounted once in the dashboard
  layout): fires `POST /heartbeat` every **60 s** while
  `document.visibilityState === "visible"`, immediately on `focus`, paused
  when hidden. Uses `navigator.sendBeacon` fallback on `pagehide`.
- `usePresence()` hook: fetches `GET /api/v1/presence` and refetches on
  interval (90 s) + window focus, exposing `onlineIds: Set<string>`.
- UI consumer (phase 2): green dot on avatars in Messages/conversation lists;
  nothing renders differently until that ships.

### Network & cost profile

| Item | Cost |
|---|---|
| Heartbeat | 1 tiny request/user/min (~60 B up, ~40 B down). 100 concurrent actives ≈ 144k req/day — inside Vercel free tier; visibility-aware pausing cuts it further |
| Mongo writes | Same rate as heartbeats; single-document upserts, trivial |
| Reads | One batched GET per viewer per 90 s |
| Storage | Self-cleaning via TTL (≤ #active users rows) |

### Alternatives rejected

- **Socket.IO in-memory maps** — impossible on Vercel serverless.
- **Pusher/Ably free tier** — third-party dependency + concurrency ceilings
  against the $0-hosting goal; revisit only if real-time chat lands.
- **Polling the full user list without heartbeats** — no reliable "online"
  signal, higher read amplification.

### Flagged follow-up (out of scope here)

Real-time chat (§5, `lib/socket/*`) has the same Vercel problem. When chat
matters, either host a tiny persistent companion (Fly.io/Railway) running the
socket server against the same Mongo, or adopt a hosted realtime provider.
Presence above stays correct regardless of that choice.

## Implementation order (when approved)

1. Prisma model + `db push`
2. API routes (heartbeat, list)
3. `PresenceHeartbeat` + dashboard layout mount
4. `usePresence` hook + `OnlineDot` primitive
5. Wire dots into Messages list (phase 2 UI)
6. Verify: typecheck · lint · build · manual heartbeat/TTL smoke test
