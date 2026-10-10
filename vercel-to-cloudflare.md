# TGAW: Vercel → Cloudflare Workers + Supabase Realtime Chat Overhaul

**Date**: `2026-10-09`
**Author**: AI Developer
**Status**: Plan approved → ready for implementation

---

## 1. Overview

Replace the existing **MongoDB + Socket.IO** chat architecture with a **Supabase Realtime–only** solution, and deploy the entire **The Global Altar Watch (TGAW)** app on **Cloudflare Workers** instead of Vercel (free‑tier threshold pause). Better Auth remains the authentication layer; no middleware.ts is used (per AGENTS.md).

### 1.1 Motivation

| Concern | Vercel (current) | Cloudflare (new) |
|---------|------------------|------------------|
| Free‑tier threshold | Paused after X hours/GB | Workers: ≤10M requests/day, ≤50GB bandwidth (generous) |
| Persistent Node process | `server.ts` with Socket.IO (long‑lived HTTP server) | Not needed — Supabase managed WS layer |
| Deployment cost | $0 (free) but paused | $0 (Workers free tier) + free Supabase tier |
| Scaling | Limits on function duration/concurrency | Workers scale automatically; Durable Objects available if needed |

### 1.2 Core Changes

1. **Remove Socket.IO** — no custom server, no `server.ts` long‑-lived process.
2. **Add Supabase Realtime** — Postgres‑based pub/sub via websockets, managed by Supabase.
3. **Configure Next.js for Cloudflare output** — `output: 'standalone'` or `export`.
4. **Keep Better Auth** — unchanged `lib/auth.ts`, `proxy.ts`, `app/(auth)/*`.
5. **Deploy via installed skill** — `cloudflare-deploy` (already installed globally across 55 agents).

---

## 2. Database Schema (Supabase Postgres)

Run this SQL in the Supabase SQL editor (or via `supabase db push`):

```sql
-- conversations (direct or group)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  title text,                              -- null for direct; set for group
  is_private boolean not null default true,
  creator_id uuid references auth.users not null,
  created_at timestamptz default now()
);

-- conversation members (many‑to‑many)
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations on delete cascade,
  user_id         uuid references auth.users on delete cascade,
  role           text not null default 'member'
    check (role in ('member','admin','moderator')),
  joined_at      timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id       uuid references auth.users not null,
  body            text,
  created_at      timestamptz default now()
);

-- indexes for realtime + feed queries
create index if not exists messages_conv_created_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_idx
  on public.messages (sender_id);
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- conversations: users can view conversations they created or are members of
create policy "users view their conversations"
  on public.conversations for select
  using (
    auth.role() = 'authenticated' and
    (creator_id = auth.uid() or
     id in (select conversation_id from public.conversation_members where user_id = auth.uid()))
  );

create policy "creators manage their conversations"
  on public.conversations for all
  using (creator_id = auth.uid());

-- conversation_members: members can view; creators/admins manage
create policy "members view conversation members"
  on public.conversation_members for select
  using (user_id = auth.uid());

create policy "creators manage members"
  on public.conversation_members for all
  using (exists (select 1 from public.conversations c where c.id = conversation_id and c.creator_id = auth.uid()));

-- messages: participants can insert and view; creators/admin can delete
create policy "participants view messages"
  on public.messages for select
  using (
    auth.role() = 'authenticated' and
    exists (select 1 from public.conversation_members cm
            where cm.conversation_id = conversation_id
              and cm.user_id = auth.uid())
  );

create policy "senders insert messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "creators/admin delete messages"
  on public.messages for delete
  using (
    auth.role() = 'authenticated' and
    (exists (select 1 from public.conversations where id = conversation_id and creator_id = auth.uid())
     or exists (select 1 from public.conversation_members where conversation_id = conversation_id and user_id = auth.uid and role = 'admin'))
  );
```

---

## 4. Real-Time Channel Design

| Item | Specification |
|------|--------------|
| **Channel name** | `tgaw-chat-{conversationId}` (private per conversation) |
| **Trigger** | `postgres_changes` on `messages` table, filtered by `conversation_id=eq.{conversationId}` |
| **Event** | `broadcast` with payload `{ type: 'INSERT', table: 'messages', data: newMessage }` |
| **Client SDK** | `import { createClient } from '@supabase/supjs'` (or `@supabase/realtime`) |
| **Subscribe pattern** (client, e.g. in a chat screen): | ```javascript\nuseEffect(() => {\n  const supa = supabase.createClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL,\n    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY\n  )\n  const channel = supa.channel(`chat-${conversationId}`)\n  channel.on(\n    'postgres_changes',\n    {\n      event: 'INSERT',\n      schema: 'public',\n      table: 'messages',\n      filter: `conversation_id=eq.${conversationId}`,\n    },\n    (payload) => {\n      addMessage(payload.new)\n    }\n  )\n  channel.subscribe()\n  return () => channel.unsubscribe()\n}, [conversationId])\n``` |
| **Typing indicators** | Optional: Supabase Presence API, or custom `postgres_changes` on a `typing` table. |
| **No global Socket.IO** | Each component opens its own Supabase channel; channels auto‑close on unmount. |

---

## 5. Better Auth Integration (keep as‑is)

- **No changes** to `lib/auth.ts`, `proxy.ts`, or `app/(auth)/*`.
- Better Auth session JWT is automatically available to the Supabase client via cookies/headers when the user logs in through the Better Auth flow (`/login`, `/signup`, `2FA`).
- The `auth.users` table that RLS policies reference is **Better Auth's `User` model** (`id` column maps to `User.id` from Better Auth). This works because both systems share the same Postgres instance (Supabase can connect to an existing Postgres DB, or the Supabase project is set up to use the same database).
- If the `auth.users` mapping is problematic, create a `public.profiles` table mirroring Better Auth users and reference that instead. But the default setup typically works.

**Environment**: No new auth env vars needed beyond what already exists (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`, `SUPERADMIN_EMAILS`).

---

## 6. Replacing Socket.IO — Component Changes

| Current (Socket.IO) | New (Supabase Realtime) |
|---------------------|--------------------------|
| `lib/socket/server.ts` — HTTP server + Socket.IO setup | **Delete** (no longer needed) |
| `lib/socket/client.js` — client singleton, `io()` | **Delete** |
| `providers/SocketProvider.tsx` — root‑level connect, room join/leave | **Replace with** `providers/RealtimeProvider.tsx` (see below) |
| `app/(dashboard)/messages/[conversationId]/page.tsx` — message list + composer, `socket.on('message:new')` | **Replace with** `useEffect` subscribing to `postgres_changes` channel |
| `app/(dashboard)/groups/[groupId]/chat/page.tsx` | Same pattern; channel name includes group ID |
| Server actions (`actions/messageActions.ts`) | **Optional** — can keep for validation + `supa.from('messages').insert()`, or replace with direct SDK calls |
| Notifications (email/push via `lib/notifications/dispatch.ts`) | **Keep** — messages still generated; realtime just changes persistence/broadcast. Dispatch still sends email/push as before. |

### New `RealtimeProvider` (skeleton)

Create `providers/RealtimeProvider.tsx`:

```tsx
// providers/RealtimeProvider.tsx
import { ReactNode, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supjs'

let supa: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supa) {
    supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supa
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const supa = getSupabase()

  useEffect(() => {
    // no‑op; channels are opened per‑component
  }, [supa])

  return <>{children}</>
}
```

**Root layout wrap** (in `app/layout.tsx` or root `providers`):

```tsx
// app/layout.tsx (or wherever providers are)
import { RealtimeProvider } from '@/providers/RealtimeProvider'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RealtimeProvider>{children}</RealtimeProvider>
      </body>
    </html>
  )
}
```

---

## 7. Cloudflare Workers Deployment

Since the goal is to move off Vercel (free‑tier threshold reached), the app will be deployed via the **`cloudflare-deploy`** skill that was just installed.

### 7.1 `next.config.ts` — Cloudflare output config

```typescript
// next.config.ts
import { defineConfig } from 'next/config'
export default defineConfig({
  output: 'standalone', // produces a self‑contained folder for Cloudflare Workers
  // alternatively: export {} for pure static generation (if no server-only code)
})
```

### 7.2 Environment variables (`.env` and Cloudflare dashboard)

```env
# Better Auth (kept, unchanged)
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://your-app.tgaw.app"
NEXT_PUBLIC_APP_URL="https://your-app.tgaw.app"

# Supabase (new)
NEXT_PUBLIC_SUPABASE_URL="https://<org>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="ey ..."

# Optional: Cloudflare-specific (if using D1, KV, etc.)
CF_PAGES="true"
```

### 7.3 Install dependencies for Cloudflare

```bash
# From the repo root
bun add -D wrangler cfenv
# or: npm install -D wrangler cfenv
```

### 7.4 Deploy command (via the installed skill)

The `cloudflare-deploy` skill was installed globally across all agents. From the repo root:

```bash
# Method 1: using the skills CLI
npx skills deploy --skill cloudflare-deploy

# Method 2: if the skill provides a custom script
# (check the skill's CLI; the installed skill at ~/.agents/skills/cloudflare-deploy
# should expose the appropriate command)

# General cloudflare-deploy usage (from skill docs):
# cloudflare-deploy deploy <app-directory>
# or simply push via git to the Cloudflare Pages repo.
```

### 7.5 Vercel → Cloudflare migration notes

| Concern | Vercel (old) | Cloudflare (new) | Mitigation |
|---------|--------------|------------------|------------|
| Free‑tier threshold | Paused after X hours/GB | Workers free tier: ≤10M requests/day, ≤50GB bandwidth | Monitor via Cloudflare dashboard; no automatic pause. |
| Serverless function timeout | 10s max (Vercel) | 30s per request (Workers); long‑running via Queues or Durable Objects | Chat realtime is browser‑driven, not server‑timeout dependent. |
| Environment variable limits | 1KB | 128KB per secret; larger via KV | No issue for auth/Supabase keys. |
| MongoDB Atlas connection | Allowed from Node server | Not needed — data in Supabase Postgres | MongoDB can stay for other parts of TGAW (events, posts) if desired, but chat no longer uses it. |
| Custom `server.ts` | Required for Socket.IO | Not needed — Supabase handles realtime | Remove `server.ts`, `lib/socket/*`, `providers/SocketProvider.tsx`. |

---

## 8. Migration Path (step‑by‑step, after approval)

1. **Create Supabase project** → `supabase init` → set up DB + Realtime.
2. **Run the SQL schema** (conversations, members, messages, RLS) — see §3.
3. **Update `next.config.ts`** for Cloudflare `output: 'standalone'` — §7.1.
4. **Add env vars** (Supabase URL/key; Better Auth vars unchanged) — §7.2.
5. **Remove Socket.IO files**: `lib/socket/server.ts`, `lib/socket/client.ts`, `providers/SocketProvider.tsx`.
6. **Add `RealtimeProvider`** and update chat components to subscribe via `postgres_changes` — §6.
7. **Test realtime**: send message on one client → appears on another instantly.
8. **Optional**: keep `/api/v1/messages` REST endpoints for initial history load (first‑page fetch), then realtime fills in new messages.
9. **Deploy to Cloudflare** via `cloudflare-deploy` skill — §7.4.
10. **Monitor**: Cloudflare dashboard for usage; Supabase dashboard for Realtime bandwidth.

---

## 9. Open Decisions (for user confirmation before implementation)

| # | Decision | Options | Recommended |
|---|----------|---------|-------------|
| 1 | **Preserve existing MongoDB chat history** | a) Export & import into Supabase Postgres <br> b) Start fresh (new conversations/messages) | (b) simpler; (a) needed if old chat must be kept. |
| 2 | **Keep `/api/v1/messages` REST endpoints** | a) Keep for history load + fallback <br> b) Remove — realtime‑only, use Supabase `SELECT * FROM messages ORDER BY created_at DESC LIMIT 50` | (a) improves first‑page UX; (b) simpler architecture. |
| 3 | **Attachments (images/files)** | a) Supabase Storage bucket + URL stored in `messages.body` <br> b) Keep Cloudinary (already used elsewhere in TGAW) | (a) unifies storage; (b) avoids another config but duplicates uploader. |
| 4 | **Typing indicators / presence** | a) Supabase Presence API <br> b) Custom channel + last‑seen timestamps <br> c) Skip (not essential) | (a) richest UX; (c) simplest. |
| 5 | **Better Auth ↔ Supabase `auth.users` mapping** | a) Use Better Auth `id` directly (default, works if sharing Postgres) <br> b) Create `profiles` table mirroring Better Auth users, reference that | Option (a) is least code; (b) adds safety if you later swap auth. |

---

## 10. Deliverable (after user confirms decisions)

Once the user confirms the decisions in §9, the following will be provided:

1. **Supabase SQL schema** — conversations, members, messages, RLS policies (ready to paste).
2. **`RealtimeProvider.tsx`** and **chat component modifications** (supabase subscribe pattern).
3. **`next.config.ts`** Cloudflare config snippet.
4. **`.env.example`** additions (Supabase keys + Cloudflare notes).
5. **Deploy checklist** for Cloudflare Workers (`cloudflare-deploy` skill usage).
6. **Optional migration script** (MongoDB → Supabase Postgres) if preserving history.
7. **TypeScript types** from Supabase (`supabase gen types`).
8. **Updated `proxy.ts`** — verify RBAC guards still work (no changes needed if Better Auth kept).

---

## 11. Quick Reference Commands

```bash
# 1. Ensure cloudflare-deploy skill is installed (already done globally)
npx skills ls -g | grep cloudflare-deploy

# 2. Create Supabase project (one‑off)
supabase init
supabase db push   # runs the SQL from §3

# 3. Update next.config.ts
#    set output: 'standalone'

# 4. Add env vars to .env (and Cloudflare dashboard)
#    NEXT_PUBLIC_SUPABASE_URL=...
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 5. Remove Socket.IO (delete these files)
#    lib/socket/server.ts
#    lib/socket/client.ts
#    providers/SocketProvider.tsx

# 6. Add RealtimeProvider and update chat components
#    (see §6 for the skeleton)

# 7. Deploy to Cloudflare
npx skills deploy --skill cloudflare-deploy
# or: npx skills add . --skill cloudflare-deploy -g -y

# 8. Verify
#    - Log in via Better Auth (unchanged)
#    - Open two browser windows; send a message in one → appears in the other
#    - Check Cloudflare dashboard → no free-tier pause
#    - Check Supabase Realtime → messages broadcasting
```

---

**End of Plan**. Save this file as `vercel-to-cloudflare.md` and proceed with implementation once the user confirms the decisions in §9.