# Mongo Backup & Restore Scripts — Design

**Date:** 2026-09-26
**Status:** Approved (design stage)
**Scope:** Manual, key-guarded JSON backup of the Atlas `tgaw` database to `db_backup/`, plus a separate restore script that mirrors a chosen dump into any target MongoDB.

## Problem

There is no way to take a local snapshot of the production Atlas database or load one into another MongoDB instance. The user wants two manually-run scripts in the repo's existing `scripts/` style.

## Decisions (from Q&A)

| Question | Decision |
| --- | --- |
| Purpose | Manual, on-demand dumps (not scheduled, not CI) |
| "Key" parameter | Authorization passphrase: CLI `--key` must match `DB_BACKUP_KEY` from `.env`; script refuses before connecting otherwise |
| Dump location | `db_backup/<UTC-date>/<collection>.json`, `db_backup/` added to `.gitignore` |
| Restore | Separate script; restore is its own manual step |
| Target instance | User supplies the connection URI; no Docker automation, no container management by the scripts |
| Existing target data | Drop-and-replace: target DB is wiped, then the dump loads — target ends up mirroring the backup |
| Tooling | Pure TypeScript + `mongodb` driver (user's chosen sample pattern). No `mongodump`, no Docker involvement |
| Runtime | `tsx` (Node), **not** Bun: the `mongodb`/`bson` driver crashes under Bun (`node:v8 isBuildingSnapshot` is unimplemented — reproduced on this machine). Invocation for the user remains `bun run backup` / `bun run restore` |
| Serialization | **EJSON** (`EJSON.stringify`/`EJSON.parse`, `relaxed: false`) instead of the sample's `ObjectId`-only JSON reviver — lossless BSON (ObjectId, Date, Binary, Decimal128, …) so restored data is Prisma-queryable. Plain JSON.stringify would degrade `ObjectId`→string and `Date`→ISO string |

## Interface

`package.json` scripts:

```json
"backup": "tsx --env-file=.env scripts/backup-mongo.ts",
"restore": "tsx --env-file=.env scripts/restore-mongo.ts"
```

```bash
bun run backup  -- --key <DB_BACKUP_KEY>
bun run restore -- --key <DB_BACKUP_KEY> --from <folder> --uri <target-mongo-uri>
# e.g.
bun run restore -- --key secret123 --from 2026-09-26 --uri mongodb://localhost:27017/tgaw
```

`.env.example` gains `DB_BACKUP_KEY=""` (the real value lives only in local `.env`).

## Component 1 — `scripts/backup-mongo.ts`

Follows the structure of the user-supplied sample script (same beginner-friendly flow), with the EJSON and key-guard changes.

1. **Argument parsing**: delegate to shared `requireBackupKey()` in `scripts/lib/cli.ts` (requires `--key`; compares against `process.env.DB_BACKUP_KEY`; on missing/mismatch prints `[ERROR]` and `process.exit(1)` **before any connection**). Unknown/extra args are ignored.
2. **Env guard**: require `DATABASE_URL`, else `[ERROR]` + exit 1 (sample behavior).
3. **Output dir**: `resolve(process.cwd(), "db_backup", new Date().toISOString().slice(0, 10))` (UTC date, like the sample), `mkdir(..., { recursive: true })`.
4. **Connection**: single `MongoClient(DATABASE_URL, { readPreference: ReadPreference.SECONDARY })` (falls back to primary on tiers without secondaries), `await client.connect()` in `main()`.
5. **Dump loop** (read-only):
   - `db.listCollections().toArray()` → warn if empty.
   - Per collection: cursor via `for await` (no full-collection array-in-memory blowup beyond the current-doc buffer), write `EJSON.stringify(docs, { relaxed: false }, 2)` to `db_backup/<date>/<name>.json`.
   - Write `_indexes.json`: `EJSON.stringify(await db.collection(name).indexes(), { relaxed: false }, 2)` — one file holding a map of `collectionName → index specs`.
   - Per-collection `[INFO] <name>: N docs -> <path>` log; final totals line (sample style).
6. **Error handling**: `main().catch(...)` logs `[ERROR] Backup failed: <defensively stringified>` + exit 1; `.finally` always `await client.close().catch(() => {})`.

**Strictly read-only**: no writes, drops, or index changes against the source.

## Component 2 — `scripts/restore-mongo.ts`

1. **Arguments**: shared `requireBackupKey()` key guard, plus require `--from` (folder name under `db_backup/`) and `--uri` (target MongoDB connection string incl. database name). Missing any → `[ERROR]` + exit 1, before connecting.
2. **Folder validation**: `db_backup/<from>` must exist and contain at least one `*.json` collection file; otherwise `[ERROR]` + exit 1.
3. **Connect** to `--uri` only (never to Atlas).
4. **Wipe target (mirror semantics)**: drop **every** collection currently in the target database; "ns not found" on drop is non-fatal. This also removes target collections absent from the dump.
5. **Load**: for each `db_backup/<from>/<name>.json` (skipping `_indexes.json`): `EJSON.parse(text, { relaxed: false })` → `insertMany` (the driver splits into safe batches automatically; app-sized collections fit in one) → `[INFO] <name>: N docs`.
6. **Indexes**: after all inserts, read `_indexes.json` and recreate per collection (`createIndexes`), skipping the auto `_id_` index; a unique-constraint violation fails with a clear `[ERROR]` naming the collection/index.
7. **Error handling / cleanup**: same `catch` + `finally close()` pattern as the backup script.

## Files touched

| File | Change |
| --- | --- |
| `scripts/lib/cli.ts` | new — shared `getArg` + `requireBackupKey` helpers (user-approved addition; removes guard duplication between the two scripts) |
| `scripts/backup-mongo.ts` | new |
| `scripts/restore-mongo.ts` | new |
| `package.json` | add `backup`, `restore` scripts |
| `.env.example` | add `DB_BACKUP_KEY=""` |
| `.gitignore` | add `db_backup/` |

## Verification

1. `bun run typecheck` — clean.
2. `bun run lint` — no new problems beyond the repo baseline (19 errors / 39 problems).
3. **Smoke test (manual)**: `bun run backup -- --key <real key>` against Atlas — read-only, safe. Confirm files land in `db_backup/<today>/`, EJSON output contains `{"$oid": …}`/`{"$date": …}` markers, totals log correct.
4. Restore is exercised by the user against their target MongoDB when one is available (no local/Docker Mongo assumed by this design).

## Out of scope

- Docker container creation/management; `mongodump`/`mongorestore` (rejected approaches)
- Encryption of dump files at rest
- Scheduling/cron automation
- Partial/collection-selective dumps
- Automatic verification of restored data (beyond logs)
