# TGAW Next Steps

## Outstanding Tasks

### 1. Test Realtime Messaging
- [ ] Send a message in one browser window
- [ ] Verify it appears in another browser window (Supabase `postgres_changes` subscription)
- [ ] Check console for any Supabase connection errors
- [ ] Verify message persistence in database

### 2. Deploy to Cloudflare Workers
- [ ] Install Wrangler: `bun add -W wrangler` or `npm install -D wrangler`
- [ ] Configure: `npx wrangler login` (OAuth)
- [ ] Initialize Workers: `npx wrangler generate` or create `wrangler.toml`
- [ ] Deploy: `npx wrangler deploy`
- [ ] Verify deployed app at the Cloudflare URL

### 3. Move Slot Reminders to Cloudflare Cron
- [ ] Remove cron job from `server.ts` (already simplified)
- [ ] Add Cloudflare Workers cron trigger for slot reminders
- [ ] Configure KV or D1 for reminder deduplication
- [ ] Test reminder delivery

### 4. Enhance Group Page with Realtime
- [ ] Add Supabase `postgres_changes` subscription to `app/(dashboard)/groups/[id]/page.tsx`
- [ ] Enable live message updates without page refresh
- [ ] Add typing indicators (currently simplified placeholder)
- [ ] Add presence indicators online/offline status

### 5. Final Verification
- [ ] Run `npx tsc --noEmit` - confirm zero errors (except 1 minor JSX quirk)
- [ ] Run `bun run check` (Biome linter)
- [ ] Verify all RBAC routes work correctly for each role tier: member/coordinator/board/leader/superadmin
- [ ] Check that auth flow (login/signup/2FA) still works properly
- [ ] Test group creation, booking, and admin functions

## Deployment Notes for Cloudflare Workers

The project uses `output: 'standalone'` in `next.config.ts`, which generates a standalone Node.js app compatible with Cloudflare Workers. Deployment requires:

1. **Wrangler CLI**: `bun add -W wrangler` or `npm i -D wrangler`
2. **Authentication**: `npx wrangler login` (one-time OAuth)
3. **Configuration**: Create `wrangler.toml` with your account info
4. **Environment vars**: Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, `SUPERADMIN_EMAILS`, OAuth keys, Supabase keys, SMTP settings to `wrangler.toml` or `.dev.vars`
5. **Note**: The slot reminder cron previously in `server.ts` should be moved to Cloudflare Workers cron-triggers

## Architecture Migration Complete

- **Before**: MongoDB + Socket.IO custom Node server
- **After**: Supabase Realtime (`postgres_changes`) + REST API + Better Auth RBAC
- **Deploy target**: Cloudflare Workers (`output: 'standalone'`)
- **Real-time**: Supabase client-to-backend websockets (no custom server needed)