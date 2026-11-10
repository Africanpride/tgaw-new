# 🔴 Vercel Fluid Active CPU Audit — TGAW

> [!CAUTION]
> Your project is **paused for 25 days** because Fluid Active CPU hit 4h 3m / 4h. The root causes are client-side polling storms and redundant database queries on every request.

## The Math That Broke You

With just **10 active users** keeping a tab open 8 hours/day:

| Poller | Interval | Calls/hr/user | DB queries each |
|--------|----------|---------------|-----------------|
| Pulse (MobileDock + SlotSync) | 60s | 60 | 6 queries |
| Heartbeat | 120s | 30 | 2 queries (incl. upsert) |
| Online list | 180s | 20 | 2-3 queries |
| Community Activity | 90s | 40 | 7+ queries |
| Nav-user live data | 120s | 30 | ~2 queries |
| **Total** | | **180/hr/user** | **~900 DB ops/hr/user** |

**10 users × 180 × 8hrs × 30 days = 432K invocations/month**
**10 users × 900 × 8hrs × 30 days = 2.16M DB operations/month**

Every invocation burns CPU time. The 6-query pulse endpoint at 60s intervals is the single biggest offender.

---

## 🎯 Fix Plan (Priority Order)

### P0 — Immediate (cuts CPU by ~60-70%)

#### Fix 1: Unified Poll Endpoint + Longer Intervals
Merge pulse, activity, presence, and notification counts into **one** `/api/v1/dashboard/unified-poll` endpoint. Increase interval from 60s → **180s**.

**Before:** 5 endpoints × 60-90s = ~180 invocations/hr/user
**After:** 1 endpoint × 180s = ~20 invocations/hr/user → **89% reduction**

**Files to change:**
- `app/api/v1/dashboard/unified-poll/route.ts` (new)
- `components/dashboard/MobileDock.tsx` — remove standalone poll
- `components/booking/SlotSyncListener.tsx` — consume unified poll
- `components/presence/PresenceProvider.tsx` — consume unified poll
- `components/dashboard/CommunityActivity.tsx` — consume unified poll
- `components/nav-user.tsx` — consume unified poll

#### Fix 2: Kill Presence Heartbeat (or fold into unified poll)
The presence upsert every 2 minutes is pure waste. Instead, update `lastSeen` as a **side-effect** of the unified poll — if we're polling every 180s, that's our heartbeat for free.

**Files to change:**
- `components/presence/PresenceProvider.tsx` — remove standalone heartbeat
- `app/api/v1/presence/heartbeat/route.ts` — deprecate/delete
- `app/api/v1/dashboard/unified-poll/route.ts` — upsert presence as side-effect

#### Fix 3: Eliminate Redundant Session Lookups
Currently every dashboard page does: `proxy.ts` → `auth.api.getSession()` **THEN** `layout.tsx` → `auth.api.getSession()` **THEN** `page.tsx` or API route → `auth.api.getSession()` again. That's 2-3 DB round-trips for the same session.

**Solution:** Set session data as response headers in `proxy.ts`, read from headers in layout/pages.

**Files to change:**
- `proxy.ts` — set `x-user-id`, `x-user-role`, `x-user-name` headers
- `app/(dashboard)/layout.tsx` — read from headers instead of DB call
- `lib/auth-helpers.ts` (new) — `getSessionFromHeaders()` utility

#### Fix 4: Cache Profile Check in Cookie
`proxy.ts` calls `prisma.userProfile.findUnique()` on **every matched request** to check onboarding status. Store a `profile-complete=1` cookie after first successful check.

**Files to change:**
- `proxy.ts` — check cookie first, skip DB call if present

---

### P1 — High Impact (cuts remaining CPU by ~30%)

#### Fix 5: Add Response Caching to Heavy Endpoints

| Endpoint | Current | Add Cache |
|----------|---------|-----------|
| `/api/v1/dashboard/pulse` | No cache | 30s stale-while-revalidate |
| `/api/v1/activity` | No cache | 60s |
| `/api/v1/admin/coordinator-stats` | No cache | 300s (5 min) |
| `/api/v1/admin/board-stats` | No cache | 300s (5 min) |
| `/api/v1/presence` (GET) | No cache, **no limit** | 30s cache + `.take(100)` |

#### Fix 6: Make Overview Page ISR
Add `export const revalidate = 30` to the overview page so it doesn't re-render server-side on every navigation. Move user-specific data (my slots, my stats) to client-side fetches.

**File:** `app/(dashboard)/overview/page.tsx`

#### Fix 7: Make Landing Page Static
Remove `force-dynamic` from the landing page. Every visitor currently triggers a full serverless function.

**File:** `app/[locale]/page.tsx` — change to `export const revalidate = 3600`

---

### P2 — Cleanup

#### Fix 8: Delete Legacy Endpoints
- `/api/v1/slots/changed/route.ts` — superseded by pulse
- `/api/v1/mobile-dock/route.ts` — superseded by pulse

#### Fix 9: Fix N+1 in Conversations
`/api/v1/conversations` runs `message.count()` per conversation. Replace with a single aggregation.

#### Fix 10: Skip Redundant Slot Generation Check
`ensureSlotsForDate()` runs `prisma.slot.count()` on every slot fetch. Store the generation window in `BookingConfig` and skip the check for dates already covered.

---

## 📊 Projected Impact

| Metric | Current (30 days) | After Fixes | Reduction |
|--------|-------------------|-------------|-----------|
| Function Invocations | 282K | ~60-80K | **~72%** |
| Fluid Active CPU | 4h 3m | ~1h 10m | **~72%** |
| DB Operations (est.) | ~2M+ | ~400K | **~80%** |

> [!IMPORTANT]
> Fixes 1-4 alone should keep you well within the free tier. The key insight: **one unified poll at 180s replaces five separate polls at 60-120s**, cutting invocations by ~89% and DB operations proportionally.

