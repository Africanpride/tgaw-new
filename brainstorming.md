# Chat / Messaging Architecture — Brainstorming Notes

**Status**: Brainstorming in progress (grilling round 2 of N) — not an approved plan
**Date started**: 2026-11-10
**Repo**: `tgaw-new` (Next.js 16, Prisma + MongoDB Atlas, Better Auth, Cloudinary)

---

## 1. The problem we're solving

1. **Chat does not work.** The current system is broken and messages appear not to persist chat sessions.
2. **Hosting must stay free.** We must not exceed the Vercel free tier. If no sustainable free-tier solution exists, we explore Cloudflare Workers free tier.

Everything else about chat (UI, reactions, media, read receipts) is secondary to these two.

---

## 2. What the codebase actually does today

### 2.1 Storage is MongoDB

`prisma/schema.prisma`:
- `Conversation` — `type` (`DIRECT` | `GROUP`), `memberIds String[]`, `groupId?`
- `Message` — `conversationId`, `senderId`, `body`, `attachmentUrl?`, `replyToId?`, `readBy String[]`, `editedAt?`, `deletedAt?`
- `MessageReaction` — `messageId`, `userId`, `emoji`

### 2.2 Reads/writes go to Mongo via Prisma — and are intact

| Path | File |
|---|---|
| List messages | `app/api/v1/messages/route.ts` → `prisma.message.findMany()` |
| Send message | `app/api/v1/messages/route.ts` → `prisma.message.create()` |
| Edit / delete | `app/api/v1/messages/[id]/route.ts` |
| Reactions | `app/api/v1/messages/[id]/reactions/route.ts` |
| Conversation list + unread counts | `app/api/v1/conversations/route.ts` |
| Group conversation create | `app/api/v1/groups/[id]/conversation/route.ts` |
| Read receipts | `actions/messageActions.ts` |

Client send path: `components/messages/ChatPanel.tsx` → `POST /api/v1/messages`. There is **no code path where a successfully created message is discarded**.

### 2.3 "Realtime" was migrated to Supabase and never finished

The client already subscribes to Supabase `postgres_changes` on `public.messages`:
- `hooks/useMessages.ts:80`
- `components/messages/ChatShell.tsx:53`
- `app/(dashboard)/groups/[id]/page.tsx:96`

But **nothing in the repo ever writes a row into Supabase**: there is no server-side Supabase client, no SQL, no migrations. `grep -i supabase` finds only `providers/RealtimeProvider.tsx` plus the three subscription call sites. `server.ts` had Socket.IO removed entirely.

Consequence: every message goes to Mongo, Supabase Realtime has nothing to broadcast, and chat is not live.

### 2.4 Three concrete defects in the half-built state

1. **Field-naming mismatch** — subscriptions filter on `conversation_id` (snake_case) while handlers read `payload.new.deletedAt` / `editedAt` (camelCase). One of the two is wrong regardless of what table gets built.
2. **No channel authorization** — the client is `createClient(url, anonKey)` with no `realtime.setAuth()`. Realtime evaluates RLS *per subscriber using that client's JWT*; with only the anon key every row is either invisible or (if RLS is off) readable by anyone holding the public anon key. For DMs that is a data leak.
3. **`useTyping` / `usePresence` are no-ops** — the comments in `hooks/useTyping.ts` and `hooks/usePresence.ts` admit it.

Also worth knowing: `next_steps_todo.md` claims "Architecture Migration Complete". It is not.

### 2.5 A documented write-reliability incident (important)

`lib/db/mongoRecovery.ts` explains that `mongodb@7` leaves a closed topology behind when the *first* connect fails, poisoning serverless isolates until recycled:

> *"on Vercel that meant a transient Atlas outage poisoned serverless isolates until they were recycled (observed prod incident: 15:05–15:17, 100+ auth 500s)"*

So writes silently failing on Vercel serverless is a **known failure mode in this repo**. If messages are genuinely lost (not just invisible until refresh), this — not the transport — is the cause.

---

## 3. Hosting limits — verified, not remembered

**Vercel Hobby (free), monthly allotments** — <https://vercel.com/docs/limits> + fair-use guidelines:
- Function invocations: first **1,000,000**
- Fast data transfer: first **100 GB**
- Active CPU: **4 hours**
- Max function duration: **300s** (5 min), default and max

**Cloudflare Workers Free** — <https://developers.cloudflare.com/workers/platform/limits/>:
- Requests: **100,000 / day**
- CPU time: **10 ms** per invocation
- Memory: 128 MB
- **Duration limit for HTTP requests: no limit**

**The decisive row** is the last one. On Vercel a long-lived stream is a function instance held open, capped at 300s, burning Active CPU, forcing every browser to reconnect ~12×/hour. On Workers the same stream can stay open indefinitely and costs nothing while idle.

Current deploy state is ambiguous: `.vercel/project.json` shows the project is linked to Vercel (`tgaw-new`), `vercel-to-cloudflare.md` is an approved plan to move off it (Vercel paused the free tier), and `wrangler.toml` is **not yet a valid Workers config** (`type = "javascript"`, `[build] output = "standalone"`, no OpenNext `main` entry).

---

## 4. Options considered

### Option A — Supabase owns chat data (true dual-DB)
Postgres tables for conversations/messages/reactions/reads + Supabase Realtime (WebSocket). Mongo keeps users, posts, groups, slots, notifications.

- **Pros**: real websockets, chat load off Mongo, Presence + Broadcast built in.
- **Cons**: identity bridge, JWT minting, RLS policies, and cross-DB consistency for user/group deletes, bans, account export, unread badges, board stats. Estimated **2–3 weeks**.
- **Critical detail**: Better Auth ids are random strings, **not UUIDs** — so RLS must use `(select auth.jwt()->>'sub')` as text. `auth.uid()` casts `sub` to `uuid` and will throw.
- Supabase Realtime enforces RLS per subscriber; **deletes only deliver the primary key** (the row is gone, so RLS can't be evaluated).

### Option B — Supabase as transport only (single DB)
No Postgres tables. Mongo stays the single source of truth; after the Prisma write succeeds, the API route publishes to a private channel.

- **Pros**: ~3 days, one database of record, zero dual-write drift, no data migration.
- **Cons**: still needs a per-user credential for private channels; Mongo still carries chat load (fine at this scale).

### Option C — Upstash Redis / **Upstash Realtime**
Two different products, and the distinction is the point:

| | `@upstash/redis` | `@upstash/realtime` | Supabase Realtime |
|---|---|---|---|
| What it is | KV/REST Redis client | Realtime transport (Redis Streams + **SSE over HTTP**) | Postgres WAL + **WebSocket** |
| Browser-safe? | **No** — stateless REST, a publish-capable token lets anyone inject into any channel; no RLS-equivalent | Yes — you own the route handler + Better Auth guard | Yes, but only with a minted Supabase JWT + RLS |
| Replaces transport | ✗ | ✓ | ✓ |
| Replaces database | ✗ | ✗ | ✓ |
| Needs a second DB of record | No | No | Only if you put tables there |
| Replay after reconnect | — | ✓ (stream cursor) | ✗ (no such primitive) |

- **Pros**: deletes the hardest piece of Option A (no JWT minting, no RLS on `realtime.messages`, no non-UUID gymnastics); authenticated by the existing `auth.api.getSession()` guard; stream replay with a cursor; Zod-typed events; **host-agnostic** — identical code on Vercel and Workers, so chat can be fixed before the hosting question is settled.
- **Cons**: `@upstash/realtime` is **young** (the author describes it as an accidentally-created product); SSE means one long-lived HTTP request per connected client — ideal on Workers, a 300s-reconnect treadmill on Vercel Hobby; does nothing to take chat load off Mongo.

### Option D — one DB, Mongo Atlas change streams
Atlas is a replica set and the `mongodb` driver is already a dependency, so `db.collection.watch()` works. But change streams need an **always-on process** — exactly what was given up when Socket.IO was removed. Not recommended.

### Option E — Workers-native WebSocket via Durable Object
Zero new vendors, free-tier viable, but requires finishing the OpenNext migration *and* routing WebSockets outside Next's request handling. Highest infra risk of the set.

---

## 5. Decisions settled so far

| Decision | Answer | Notes |
|---|---|---|
| Sender display resolution | Snapshot + mirrored profile table | **Pins back if single-DB** — with one database the mirror table is dead weight and "snapshot only" is correct |
| Chat attachments | Keep Cloudinary | `attachmentUrl` stays an opaque URL string |
| Problem statement | Chat must work; hosting must stay free | Vercel first, Cloudflare as fallback |

Nothing else is settled. `@upstash/redis` and Supabase are both still on the table; neither is committed.

---

## 6. Open questions (grilling round 2 — awaiting answers)

### Q1 — What exactly does "doesn't persist chat sessions" look like?
- **(a)** Send → refresh → message is *gone*, never saved.
- **(b)** Send → nothing appears → refresh → it *is* there (saved, realtime dead).
- **(c)** Message saves, but the *conversation* vanishes from the inbox on reload.
- **(d)** Can't start a new chat at all; the conversation is never created.

**Recommended answer**: (b). The write path is intact, so unreliability points at the realtime layer — unless it's (a), in which case this is an Atlas/serverless write problem wearing a chat costume, and no transport change will fix it.

### Q2 — Host-agnostic transport, or settle hosting first?
**Recommended answer**: host-agnostic SSE over a Next route handler. Chat works today on either host; the Workers migration becomes a separate later decision driven by traffic, not a prerequisite.

### Q3 — Harden the write path in the same pass?
**Recommended answer**: yes — bounded retry with jitter around the Prisma write, plus a client-side "failed to send, retry" affordance that preserves the draft. A few hours, and it's the difference between "chat works" and "chat works on a good day".

---

## 7. Frontier for round 3 (unblocked once Q1–Q3 are answered)

- SSE route contract: event shape, channel naming, and cursor/`Last-Event-ID` resume semantics.
- Event taxonomy: `message.created` / `message.updated` / `message.deleted` / `reaction.changed` / `conversation.created`.
- Read receipts: stop the per-message N-write fan-out (`readBy String[]` on every message → batched or a separate table).
- Typing + presence: implement for real, or delete the no-op hooks outright.
- Conversation ordering: `Conversation.updatedAt` is **not** bumped when a message is inserted — decide whether to bump it on write or order by last message.
- Removal list: which Supabase scaffolding files, `RealtimeProvider` exports, and env keys get deleted.
- Account export, `admin/board-stats`, and `lib/mobileDock.ts` unread badges — confirm they still read the right store.

---

## 8. My standing recommendation (uncommitted)

**Upstash Realtime SSE + Mongo as the single store + bounded write retry, then move to Cloudflare Workers when Vercel's CPU allotment or 300s cap becomes the binding constraint.**

Rationale in one line: it fixes the actual defect (dead realtime) in days rather than weeks, adds no second database and therefore no dual-write debt, needs no JWT minting or RLS work, survives a reconnect with stream replay, and is deployable to either host unchanged — which decouples "make chat work" from "choose a host".
