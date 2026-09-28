# Subagent Progress Ledger

Plan: docs/superpowers/plans/2026-09-27-calendar-sync-ical-feed.md
Branch: feat/calendar-ical-feed (BASE 3e6bdab = main e8db11d + 4 mongo-backup commits)
Baseline: typecheck exit 0; bun test 74 pass/0 fail; i18n:check OK; lint 19 errors/20 warnings (pre-existing, unchanged)
Note: unrelated dirty files present (`lib/auth.ts`, `scripts/backup-mongo.ts`, `scripts/restore-mongo.ts`, `lib/db/mongoRecovery.*`, `docs/superpowers/*`, this ledger) — never stage them.
Old plan's ledger archived at `.superpowers/sdd/progress-archive-2026-09-26-mongo-backup.md`.

## Task status

(none complete yet)
Task 1: complete (commits 3e6bdab..2b7bdf5, review clean; DB index state verified by controller: user_calendarFeedToken_idx plain, no scratch collections)
  Minor for final review triage:
  1. task-1-report.md BLOCKED-section self-review still asserts "@unique for findUnique" (superseded by Resolution; report hygiene only)
  2. Path B residual (user-approved): no DB-level token uniqueness — randomBytes(32) entropy; concurrent ensureCalendarFeedToken race can leave one caller a dead link (self-heals on retry)
Task 2: complete (commit 309af85, review clean; 11/11 focused + 85/85 suite; plan amended: sanitizeUri import + DESCRIPTION count assertion)
  Minor for final review triage:
  1. foldLine tests never assert 75-octet physical-line bound (plan-origin gap; regression to 500-byte threshold stays green)
  2. buildIcs([], stamp) empty-list behavior untested
  3. UID: inserted raw (ics.ts:85) — plan-mandated, unreachable downstream (ObjectId hex); sanitizeUri(event.uid) would close it
  4. formatIcsUtcDate(invalid Date) throws RangeError, untested/undocumented
  5. brief comment line dropped above count assertion (cosmetic)
  6. edge notches: window year-cross start, Feb-29 end roll, no-bare-LF global assert
Task 3: complete (commit 49ea584, review approved; 5/5 focused + 90/90 suite; plan amended: `slot.type as keyof FeedLabels` cast)
  Controller rulings:
  - TDD RED gate ACCEPTED: tests are plan-authored (pre-exist implementation by construction); first implementer's RED run was transcript-only (session later hit harness error), no repairable artifact. Hearsay disclosed honestly in report.
  - Reviewer ⚠️ "legacy EventBooking contradiction" came from CONTROLLER's dispatch copy error, not the plan: plan:1398 is authoritative (EventBooking excluded from feed); Task 3/4 code correctly excludes it. No plan change.
  - Full-suite [ERROR] lines: pre-existing deliberate error-path logs from lib/auth/oauthLinkProfileGuard.test.ts (verified: 9 pass, exits clean). Not a regression.
  Minor for final review triage:
  1. task-3-report.md claims brief:212 stale — false, brief was regenerated post-amendment (report hygiene)
  2. untested branches: description||null empty-collapse (feedItems.ts:82), exact-link-miss url undefined (feedItems.ts:60-62)
Task 4: complete (commit 3aed598, review approved; typecheck 0, 90/90 suite, route eslint clean)
  Sequencing note: calendar page copy-iCal button is a DEAD URL until Task 7 swaps in SyncCalendarDialog (plan-sequenced interim breakage, review Important #1) — Task 8 MUST verify the page wiring, not only API curl.
  Minor for final review triage:
  1. task-4-report.md line-count arithmetic wrong (84 = 51+33 change count, not 75-line file length) — report hygiene
  2. perf note (plan-mandated shapes): prisma.event date-range+OR has no @@index; meetingLink filters on date with only @@unique([type,date]) — both collscans, small volumes
Task 5: complete (commit f350fd0, review clean; typecheck 0, 90/90 suite; zero-arg signatures match Task 7 contract exactly)
  Minor for final review triage:
  1. actions/calendarFeedActions.ts:38-47 — session-outlives-user row → opaque Prisma P2025 instead of "Unauthorised" (caller catches → generic toast; plan-mandated code)
  Note: token encoding is base64url (43-char, randomBytes(32)) per plan:761 — NOT hex; Path B entropy premise holds.
Task 6: complete (commit 7fca4ec, review clean; 31 keys x4 locales byte-matched to brief, i18n:check OK before+after, all 30 plan Task-7 sync.* refs resolve)
  Note: .superpowers/sdd/task-7-brief.md held a STALE unrelated brief ("VerseCard on overview page") from an earlier SDD session — will be overwritten by this plan's task-brief 7 at dispatch time.
  Minor for final review triage:
  1. sync.loading may be unused by Task 7 dialog (Skeleton+aria-busy instead) — confirm when Task 7 lands; keep for locale parity regardless
Task 7: complete after 1 fix round (commits e754f68 + 261ac9a, final review Approved)
  - Plan amendment #4: brief Step 1 promise-chain violated react-hooks/set-state-in-effect → approved async run() wrapper (precedent CoordinatorStats.tsx:384-399); plan amended
  - Plan amendment #5 (review-found, runtime-verified with React 19 repro): loading in effect deps + sync setLoading(true) self-cancelled the in-flight fetch → permanent skeleton; fix = drop loading from guard+deps ([open, token, t]); plan+brief amended; fix commit 261ac9a verified exact/2-lines
  - Note: implementer's "byte-identical to CoordinatorStats" claim was false at dep array — precedent uses [range] only; lesson: dep arrays are part of the pattern
  Minor for final review triage:
  1. skeleton persists after failed token load until reopen (no inline error/retry in dialog)
  2. webcal conversion matches https: only — http://localhost origin toggle is a no-op (brief-prescribed)
  3. WCAG 2.5.3: Copy button aria-label overrides visible text; copied state name stays "Copy" (aria-label redundant anyway)
  4. regenerate failure reuses sync.loadFailed wording (brief-prescribed)
  5. setTimeout(clear copied) never cleared on unmount
  6. sync.loading key unused; skeleton region lacks role="status" announcement
  7. in-dialog size="sm" buttons 36px < 44px guidance (repo-wide shadcn convention, inherited)
