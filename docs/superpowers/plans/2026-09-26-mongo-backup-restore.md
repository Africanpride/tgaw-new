# Mongo Backup & Restore Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two manual, key-guarded scripts — `bun run backup` dumps the Atlas `tgaw` database losslessly to `db_backup/<UTC-date>/`, and `bun run restore` mirrors a chosen dump into any target MongoDB.

**Architecture:** Pure TypeScript using the `mongodb` driver directly (no Docker, no `mongodump`). The backup script is read-only: it streams each collection to an Extended JSON file plus an `_indexes.json` map. The restore script validates arguments before connecting, wipes every collection in the target database, loads the EJSON files, and recreates indexes. Both scripts share the same `--key` guard (`DB_BACKUP_KEY` in `.env`) and `[INFO]`/`[ERROR]` logging conventions from the user's reference sample script.

**Tech Stack:** TypeScript + `tsx` (Node runtime — the mongodb driver cannot run under Bun), `mongodb@7.5.0` (`BSON.EJSON` from `bson@7.3.1`), Bun as the script runner, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-26-mongo-backup-restore-design.md`

## Global Constraints

- **Lint baseline:** `bun run lint` currently reports **39 problems (19 errors, 20 warnings) and exits 1** — this is pre-existing. Final lint must not exceed these counts, and must report **zero problems in the new/modified files** (`scripts/backup-mongo.ts`, `scripts/restore-mongo.ts`, `package.json`).
- **Typecheck:** `bun run typecheck` (`tsc --noEmit`) must exit 0.
- **Runtime:** scripts are wired as `tsx --env-file=.env scripts/<name>.ts`. Never run scripts that import `mongodb` directly with `bun <file>.ts` — the driver crashes under Bun (`node:v8 isBuildingSnapshot` not implemented; reproduced on this machine).
- **EJSON only:** documents/indexes are serialized with `BSON.EJSON.stringify(..., { relaxed: false }, 2)` and parsed with `BSON.EJSON.parse(text, { relaxed: false })`, imported as `import { BSON } from "mongodb"`. Never `JSON.stringify`/`JSON.parse` for Mongo documents.
- **Key guard:** both scripts must exit with `[ERROR]` + exit code 1 *before opening any connection* when `--key` is missing or does not equal `process.env.DB_BACKUP_KEY`.
- **No Docker / no mongodump / no mongorestore** anywhere in this work (explicitly rejected in brainstorming).
- **Prettier style** for new files (repo `.prettierrc`): 2-space indent, double quotes, no semicolons, trailing commas (es5), printWidth 80. Format **only the new files** with `bunx prettier --write scripts/<file>.ts` — never run repo-wide `bun run format`.
- **Comments:** the new scripts intentionally carry verbose, tutorial-style comments adapted from the user's reference sample (this overrides the repo's "no comments" default — the user supplied the sample style).
- **Commits:** AGENTS.md rule takes precedence — commit only with the user's explicit approval (asked at execution handoff). Commit steps below are conditional on that approval; if withheld, skip them and leave changes for review.
- **Secrets:** never print or commit `DB_BACKUP_KEY` or `.env` contents. `.env` edits are local-only (`.env*` is gitignored).

---

### Task 1: Backup script + wiring

**Files:**
- Create: `scripts/lib/cli.ts`
- Create: `scripts/backup-mongo.ts`
- Modify: `package.json` (scripts block, add `"backup"`)
- Modify: `.env.example:1-2` (add `DB_BACKUP_KEY` under `# MongoDB Atlas`)
- Modify: `.gitignore` (add `db_backup/`)
- Local-only (never committed): `.env` (append generated `DB_BACKUP_KEY`)

**Interfaces:**
- Consumes: `process.env.DATABASE_URL` (Atlas connection string, already in `.env`); `process.env.DB_BACKUP_KEY` (created by Step 4/5); CLI `--key <value>`.
- Produces (relied on by Task 2):
  - Directory `db_backup/<YYYY-MM-DD>/` (UTC date) containing one `<collectionName>.json` per collection, each file an EJSON (`relaxed: false`) **array** of documents, e.g. `[{"_id":{"$oid":"..."},"name":"..."}]`.
  - `db_backup/<date>/_indexes.json`: one EJSON object mapping collection name → array of index specs as returned by `collection.indexes()` (e.g. `{"user":[{"v":{"$numberInt":"1"},"key":{"email":{"$numberInt":"1"}},"name":"email_1","unique":true}], ...}`).
  - `scripts/lib/cli.ts` — shared CLI helpers consumed by both backup and restore: `getArg(flag: string): string | undefined` and `requireBackupKey(): string` (exits `[ERROR]` + code 1 before any connection when `--key` is missing or ≠ `DB_BACKUP_KEY`).
  - CLI contract: `bun run backup -- --key <DB_BACKUP_KEY>` → exit 0 on success, exit 1 with an `[ERROR]` line on any failure.

- [ ] **Step 1: Create the shared CLI helper `scripts/lib/cli.ts`**

```ts
// scripts/lib/cli.ts
//
// Shared command-line helpers for scripts/backup-mongo.ts and
// scripts/restore-mongo.ts. Keeping them here means both scripts guard
// themselves identically (one place to audit, one place to change).

/**
 * Returns the value that follows a flag in argv, e.g. for
 * `--key secret` called as getArg("--key") it returns "secret".
 * Returns undefined when the flag is not present.
 */
export function getArg(flag: string): string | undefined {
	const index = process.argv.indexOf(flag)
	return index === -1 ? undefined : process.argv[index + 1]
}

/**
 * Validates `--key <value>` against DB_BACKUP_KEY (from .env).
 *
 * On a missing flag, missing env var, or mismatch it prints an [ERROR]
 * line and exits with code 1 — before any network connection is opened —
 * so an accidental run can never touch a database. Returns the key on
 * success (callers that do not need it can ignore the return value).
 */
export function requireBackupKey(): string {
	const key = getArg("--key")
	if (!key || !process.env.DB_BACKUP_KEY || key !== process.env.DB_BACKUP_KEY) {
		console.error(
			"[ERROR] Missing or invalid --key (expected --key <DB_BACKUP_KEY> from .env)",
		)
		// Exit code 1 = failure, so shell scripts and CI can detect it.
		process.exit(1)
	}
	return key
}
```

- [ ] **Step 2: Create `scripts/backup-mongo.ts`**

```ts
#!/usr/bin/env bun

// scripts/backup-mongo.ts
//
// Beginner-friendly overview:
//   This script takes a "snapshot" of the MongoDB database by reading every
//   document from every collection and writing each collection to its own
//   Extended JSON file under ./db_backup/<today's UTC date>/. Think of it as
//   a no-frills pg_dump but for MongoDB, written in TypeScript.
//
//   Running it:    bun run backup -- --key <DB_BACKUP_KEY>
//   Output:        ./db_backup/2026-09-26/user.json
//                  ./db_backup/2026-09-26/Post.json
//                  ... (one file per collection)
//                  ./db_backup/2026-09-26/_indexes.json (index definitions)
//
//   Safety:        This script is strictly read-only. It never writes to
//                  the database, never updates documents, never deletes
//                  anything, and never drops collections or indexes. It
//                  connects with readPreference=secondary so a read-heavy
//                  backup does not add load to the primary write node.
//                  (On Atlas tiers without secondaries it silently falls
//                  back to the primary — the script still works.)

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
// `node:fs/promises` is the modern, promise-based version of Node's
// filesystem API. We use `mkdir` to create the output directory and
// `writeFile` to save each collection's EJSON file.
import { mkdir, writeFile } from "node:fs/promises"

// `node:path` gives us OS-independent path helpers. `join` stitches path
// segments together with the right separator ("/" on Linux/macOS, "\" on
// Windows). `resolve` turns a relative path into an absolute one by
// prepending the current working directory.
import { join, resolve } from "node:path"

// The official MongoDB driver. `MongoClient` opens a connection,
// `ReadPreference` is the enum we use to ask for secondaries, `Document`
// is a generic record that represents a single row ("document" is MongoDB's
// term for a row), and `BSON` re-exports the BSON toolbox — we use
// `BSON.EJSON` to serialise documents losslessly (ObjectIds stay ObjectIds,
// Dates stay Dates) inside plain .json files. Plain JSON.stringify would
// silently degrade both to strings, breaking a later restore.
import { BSON, type Document, MongoClient, ReadPreference } from "mongodb"

// Shared CLI helper created in Step 1 — checks `--key` against DB_BACKUP_KEY.
import { requireBackupKey } from "./lib/cli"

// ---------------------------------------------------------------------------
// Step 1: Authorisation key guard
// ---------------------------------------------------------------------------
// The shared helper (scripts/lib/cli.ts) validates `--key <value>` against
// the DB_BACKUP_KEY value in .env and, on a missing or wrong key, prints
// [ERROR] and exits with code 1 BEFORE any connection is made. This is a
// "you meant to run this" guard: an accidental `bun run backup` (or a run
// from the wrong shell/CI job) fails fast.
requireBackupKey()

// ---------------------------------------------------------------------------
// Step 2: Pull the connection string from the environment
// ---------------------------------------------------------------------------
// `process.env` is an object Node.js fills in from the shell / .env file.
// We refuse to run without DATABASE_URL because connecting to the wrong
// database by accident would be a real disaster.
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
	console.error("[ERROR] DATABASE_URL is not set")
	process.exit(1)
}

// ---------------------------------------------------------------------------
// Step 3: Compute the output directory for today's snapshot
// ---------------------------------------------------------------------------
// `new Date().toISOString()` returns something like
//   "2026-09-26T10:00:00.000Z"
// Slicing the first 10 characters gives us the date portion only:
//   "2026-09-26"
// Using UTC means the folder name is the same regardless of where the
// script runs in the world, so snapshots are easy to compare and share.
const today = new Date().toISOString().slice(0, 10)

// Build an absolute path to ./db_backup/<today>/. `resolve` takes the
// current working directory (process.cwd()) and appends the segments.
const outDir = resolve(process.cwd(), "db_backup", today)

// ---------------------------------------------------------------------------
// Step 4: Open a MongoDB connection
// ---------------------------------------------------------------------------
// `MongoClient` is a heavy object — creating one is expensive. We make a
// single client and reuse it for every query below. The connection is not
// actually opened until we call `client.connect()` in main().
//
// `readPreference: ReadPreference.SECONDARY` tells the driver "if a replica
// set has secondaries, route my reads there", so a read-heavy backup does
// not add load to the primary. On a small/free Atlas tier with no
// secondaries, MongoDB silently falls back to the primary.
const client = new MongoClient(DATABASE_URL, {
	readPreference: ReadPreference.SECONDARY,
})

// ---------------------------------------------------------------------------
// Step 5: Walk every collection and dump it
// ---------------------------------------------------------------------------
// We wrap the work in an `async` function so we can use `await` everywhere.
// The function is typed as `Promise<void>` because it does not return a
// value — it just performs side effects (writing files to disk) and prints
// status to stdout.
async function main(): Promise<void> {
	// Make sure the output directory exists. `recursive: true` means
	// "create the directory and any missing parents, and don't error if it
	// already exists". A second run on the same day overwrites that day's
	// files (intentional: the newest run wins).
	await mkdir(outDir, { recursive: true })

	console.log("[INFO] Connecting to MongoDB (readPreference: secondary)...")

	// Open the actual TCP connection. Until this line runs, `client` is
	// just an unopened client object.
	await client.connect()

	// `client.db()` with no argument returns the default database — the one
	// specified in the connection string after the host.
	const db = client.db()

	// `listCollections()` returns a cursor over metadata for each
	// collection. `.toArray()` drains it into `{ name, type, ... }` records.
	const collections = await db.listCollections().toArray()
	if (collections.length === 0) {
		console.warn("[WARN] No collections found in database")
	}

	// Index definitions are collected here and written to _indexes.json
	// after the loop, so a restore can recreate them.
	const indexMap: Record<string, Document[]> = {}

	let totalDocs = 0
	// `for ... of` over the collections. For each one we:
	//   1. Open a cursor over every document (streamed with `for await`, so
	//      we never hold a whole collection in memory beyond this array)
	//   2. Write the array as Extended JSON to db_backup/<date>/<name>.json
	//   3. Record the collection's index definitions
	for (const meta of collections) {
		const name = meta.name

		// `find({})` returns a cursor. Pulling documents one at a time with
		// `for await (...)` is the difference between working and running
		// out of RAM on large collections.
		const docs: Document[] = []
		for await (const doc of db.collection(name).find({})) {
			docs.push(doc)
		}

		// Build the path: ./db_backup/2026-09-26/user.json
		const file = join(outDir, `${name}.json`)

		// `BSON.EJSON.stringify(docs, { relaxed: false }, 2)` produces
		// Extended JSON: ObjectIds become {"$oid": "..."}, Dates become
		// {"$date": ...}, and numbers keep their exact BSON type. It is
		// still a plain .json file — but one that `BSON.EJSON.parse` can
		// turn back into real BSON values on restore.
		await writeFile(
			file,
			BSON.EJSON.stringify(docs, { relaxed: false }, 2),
			"utf8",
		)

		console.log(`[INFO] ${name}: ${docs.length} docs -> ${file}`)
		totalDocs += docs.length

		// `collection.indexes()` lists every index (like running the
		// listIndexes command). We keep them so restore can rebuild
		// unique constraints etc.
		indexMap[name] = await db.collection(name).indexes()
	}

	// Write the index map once, alongside the collection files.
	await writeFile(
		join(outDir, "_indexes.json"),
		BSON.EJSON.stringify(indexMap, { relaxed: false }, 2),
		"utf8",
	)
	console.log(`[INFO] Index definitions -> ${join(outDir, "_indexes.json")}`)

	console.log(
		`[INFO] Backup complete. ${totalDocs} documents across ${collections.length} collections.`,
	)
	console.log(`[INFO] Output: ${outDir}`)
}

// ---------------------------------------------------------------------------
// Step 6: Run main(), catch any error, and always close the connection
// ---------------------------------------------------------------------------
// `.catch` runs if any line in main throws (network drops, auth fails,
// disk full, etc.). `.finally` runs whether the script succeeded or failed
// and is the right place to clean up the Mongo connection.
main()
	.catch((error: unknown) => {
		// Project convention: log with the [ERROR] prefix and stringify
		// defensively, because a thrown value is not always a real Error.
		const message = error instanceof Error ? error.toString() : String(error)
		console.error(`[ERROR] Backup failed: ${message}`)
		process.exit(1)
	})
	.finally(async () => {
		// Close the connection; swallow close's own error so it cannot mask
		// the original failure that triggered this finally block.
		await client.close().catch(() => {})
	})
```

- [ ] **Step 3: Add the `backup` script to `package.json`**

In the `"scripts"` block, insert directly after the `"set-superadmin"` line (keep the trailing commas correct — `"i18n:check"` stays last):

```json
		"set-superadmin": "tsx --env-file=.env scripts/set-superadmin.ts",
		"backup": "tsx --env-file=.env scripts/backup-mongo.ts",
```

- [ ] **Step 4: Add `DB_BACKUP_KEY` to `.env.example`**

Insert after the `# MongoDB Atlas` / `DATABASE_URL` lines (line 2), before the `# Better Auth` block:

```bash
# Guard key for local db backup/restore scripts (bun run backup -- --key <this>)
DB_BACKUP_KEY=""
```

- [ ] **Step 5: Add `db_backup/` to `.gitignore`**

Append at the end of the file:

```gitignore
# local mongo dumps (bun run backup)
db_backup/
```

- [ ] **Step 6: Generate the local key in `.env` (local-only, never committed)**

```bash
grep -q "^DB_BACKUP_KEY=" .env || printf '\nDB_BACKUP_KEY=%s\n' "$(openssl rand -base64 18)" >> .env
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
echo "key loaded: ${#KEY} chars"
```

Expected: `key loaded: <n> chars` (n > 0), and `git status` must **not** list `.env` (it is gitignored).

- [ ] **Step 7: Verify the guard — missing `--key` fails before connecting**

```bash
bun run backup 2>&1; echo "exit=$?"
```

Expected: prints `[ERROR] Missing or invalid --key (expected --key <DB_BACKUP_KEY> from .env)` and `exit=1`. Must return in under a second (no network attempt).

- [ ] **Step 8: Verify the guard — wrong `--key` fails before connecting**

```bash
bun run backup -- --key definitely-wrong 2>&1; echo "exit=$?"
```

Expected: same `[ERROR] Missing or invalid --key ...` line and `exit=1`, again under a second.

- [ ] **Step 9: Smoke run against Atlas (read-only, safe)**

```bash
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
bun run backup -- --key "$KEY" 2>&1; echo "exit=$?"
```

Expected (counts vary by data volume):
```
[INFO] Connecting to MongoDB (readPreference: secondary)...
[INFO] <collection>: <n> docs -> .../db_backup/<today>/<collection>.json
...
[INFO] Index definitions -> .../db_backup/<today>/_indexes.json
[INFO] Backup complete. <total> documents across <m> collections.
[INFO] Output: .../db_backup/<today>
exit=0
```

- [ ] **Step 10: Verify EJSON fidelity of the output**

```bash
ls db_backup/ | tail -1
grep -l '"\$oid"' db_backup/*/*.json | head -3
grep -l '"\$date"' db_backup/*/*.json | head -3
```

Expected: a `YYYY-MM-DD` folder; at least one file containing `"$oid"` (ObjectId `_id`s, e.g. `user.json`) and at least one containing `"$date"` (Date fields). A bare hex string or ISO string without `$oid`/`$date` would mean wrong serialization — stop and fix.

- [ ] **Step 11: Format the new files**

```bash
bunx prettier --write scripts/lib/cli.ts scripts/backup-mongo.ts
```

Expected: prints a line for each file (only those two — never run repo-wide format).

- [ ] **Step 12: Typecheck**

```bash
bun run typecheck
```

Expected: no output, exit 0.

- [ ] **Step 13: Lint (baseline must not grow)**

```bash
bun run lint 2>&1 | tail -3
bun run lint 2>&1 | grep -E "backup-mongo|lib/cli" || echo "no problems in backup-mongo.ts and scripts/lib/cli.ts"
```

Expected: `✖ 39 problems (19 errors, 20 warnings)` (identical to baseline; lint exits 1 — pre-existing) and `no problems in backup-mongo.ts and scripts/lib/cli.ts`.

- [ ] **Step 14: Commit (commits approved by user; see Global Constraints for secrets rule)**

```bash
git add scripts/lib/cli.ts scripts/backup-mongo.ts package.json .env.example .gitignore
git commit -m "feat: add key-guarded MongoDB backup script"
```

---

### Task 2: Restore script + wiring

**Files:**
- Create: `scripts/restore-mongo.ts`
- Modify: `package.json` (scripts block, add `"restore"`)

**Interfaces:**
- Consumes (from Task 1):
  - `scripts/lib/cli.ts`: `getArg(flag: string): string | undefined` and `requireBackupKey(): string` (already committed in Task 1).
  - `db_backup/<from>/` folder containing `<collection>.json` files (EJSON arrays, `relaxed: false`) plus `_indexes.json` (collection → index specs map).
  - `process.env.DB_BACKUP_KEY`; CLI contract `--key`, `--from <folder>`, `--uri <target connection string incl. database name>`.
- Produces: target MongoDB left as an exact mirror of the dump (every pre-existing collection dropped first, all dumped collections + indexes recreated); exit 0 on success, exit 1 with an `[ERROR]` line on any failure.

- [ ] **Step 1: Create `scripts/restore-mongo.ts`**

```ts
#!/usr/bin/env bun

// scripts/restore-mongo.ts
//
// Beginner-friendly overview:
//   This script loads a snapshot taken by `bun run backup` into another
//   MongoDB. It is the mirror image of the backup: before it writes
//   anything it DROPS EVERY collection in the target database, then loads
//   the dump's files and recreates the indexes. When it finishes, the
//   target database is an exact copy of the snapshot — nothing more, less.
//
//   Running it:
//     bun run restore -- --key <DB_BACKUP_KEY> --from <folder> --uri <target-uri>
//   Example:
//     bun run restore -- --key abc123 --from 2026-09-26 \
//       --uri mongodb://localhost:27017/tgaw
//
//   Safety:  This script NEVER touches the source (Atlas) database — it
//   only connects to the --uri you pass. It refuses to run at all unless
//   the key, folder, and uri are all provided, and it prints exactly what
//   it is about to drop before dropping it.

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { readFile, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { BSON, type Document, MongoClient } from "mongodb"

// Shared CLI helpers from Task 1.
import { getArg, requireBackupKey } from "./lib/cli"

// ---------------------------------------------------------------------------
// Step 1: Argument guards — all checked BEFORE any connection is opened
// ---------------------------------------------------------------------------
// Guard A: the authorisation key must match DB_BACKUP_KEY in .env. The
// shared helper prints [ERROR] and exits with code 1 on failure.
requireBackupKey()

// Guard B: --from is the folder name under db_backup/ to restore from.
const from = getArg("--from")
if (!from) {
	console.error("[ERROR] Missing --from <folder> (a folder name under db_backup/)")
	process.exit(1)
}

// Guard C: --uri is the TARGET connection string, including the database
// name (e.g. mongodb://localhost:27017/tgaw). This is the only database
// this script will ever touch.
const uri = getArg("--uri")
if (!uri) {
	console.error(
		"[ERROR] Missing --uri <target mongo connection string, incl. database name>",
	)
	process.exit(1)
}

// The client is created here (unopened) so the module-level cleanup below
// can always close it, but no network traffic happens until connect().
let client: MongoClient | null = null

// ---------------------------------------------------------------------------
// Step 2: main() — validate folder, wipe target, load dump, rebuild indexes
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
	// Resolve the dump folder: db_backup/<from> relative to the project.
	const dumpDir = resolve(process.cwd(), "db_backup", from)

	// Folder validation happens BEFORE connecting, so a typo in --from
	// fails instantly instead of after a network round trip.
	let entries: string[]
	try {
		entries = await readdir(dumpDir)
	} catch {
		console.error(`[ERROR] Dump folder not found: ${dumpDir}`)
		process.exit(1)
		return // unreachable in practice — process.exit never returns
	}

	// Collection files are <name>.json; _indexes.json is handled separately
	// after the load (it is not a collection).
	const files = entries
		.filter((name) => name.endsWith(".json") && name !== "_indexes.json")
		.sort()
	if (files.length === 0) {
		console.error(`[ERROR] No <collection>.json files found in ${dumpDir}`)
		process.exit(1)
		return
	}

	console.log(`[INFO] Restoring dump: ${dumpDir}`)
	client = new MongoClient(uri)
	await client.connect()
	const db = client.db()
	console.log(`[INFO] Connected to target database "${db.databaseName}"`)

	// --- Wipe: mirror semantics -------------------------------------------
	// Drop EVERY collection currently in the target database (not only the
	// ones present in the dump) so the target ends up exactly mirroring the
	// backup. "ns not found" means the collection vanished between the list
	// and the drop — harmless, so only other errors are fatal.
	const existing = await db.listCollections().toArray()
	console.log(
		`[INFO] Dropping ${existing.length} existing collection(s) before load...`,
	)
	for (const meta of existing) {
		try {
			await db.collection(meta.name).drop()
			console.log(`[INFO] Dropped ${meta.name}`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			if (!message.includes("ns not found")) throw error
		}
	}

	// --- Load: one EJSON array file per collection ------------------------
	let totalDocs = 0
	for (const file of files) {
		const name = file.slice(0, -".json".length)
		const text = await readFile(join(dumpDir, file), "utf8")

		// `BSON.EJSON.parse(text, { relaxed: false })` reverses the backup:
		// {"$oid": ...} becomes a real ObjectId, {"$date": ...} a real Date,
		// {"$numberInt": ...} a real integer. Plain JSON.parse would leave
		// them as strings and the app would break on the restored data.
		const docs = BSON.EJSON.parse(text, { relaxed: false }) as Document[]

		// insertMany with an empty array throws in the driver, so empty
		// collections just get logged (they still exist after a drop + no
		// inserts? they don't — create the empty collection explicitly).
		if (docs.length > 0) {
			await db.collection(name).insertMany(docs)
		} else {
			await db.createCollection(name)
		}
		console.log(`[INFO] ${name}: ${docs.length} docs`)
		totalDocs += docs.length
	}

	// --- Indexes: recreate what the backup recorded -----------------------
	const indexPath = join(dumpDir, "_indexes.json")
	let indexMap: Record<string, Document[]> = {}
	try {
		indexMap = BSON.EJSON.parse(await readFile(indexPath, "utf8"), {
			relaxed: false,
		}) as Record<string, Document[]>
	} catch {
		console.warn(
			`[WARN] _indexes.json not found or unreadable in ${dumpDir} — skipping index recreation`,
		)
	}

	for (const [name, indexes] of Object.entries(indexMap)) {
		const specs: Document[] = []
		for (const raw of indexes) {
			// The automatically created primary-key index (_id_) comes back
			// with every collection — recreating it would error.
			if (raw.name === "_id_") continue
			// `ns` (namespace) is metadata from listIndexes that the
			// createIndexes command rejects — strip it before sending.
			const spec: Document = { ...raw }
			delete spec.ns
			specs.push(spec)
		}
		if (specs.length === 0) continue
		try {
			await db.collection(name).createIndexes(specs)
			console.log(`[INFO] ${name}: ${specs.length} index(es) recreated`)
		} catch (error) {
			// A unique-constraint failure lands here with the collection and
			// index name in the message — surface it with context and stop.
			const message = error instanceof Error ? error.message : String(error)
			console.error(`[ERROR] Index recreation failed for "${name}": ${message}`)
			throw error
		}
	}

	console.log(
		`[INFO] Restore complete. ${totalDocs} documents across ${files.length} collections into "${db.databaseName}".`,
	)
}

// ---------------------------------------------------------------------------
// Step 3: Run main(), catch any error, and always close the connection
// ---------------------------------------------------------------------------
main()
	.catch((error: unknown) => {
		const message = error instanceof Error ? error.toString() : String(error)
		console.error(`[ERROR] Restore failed: ${message}`)
		process.exit(1)
	})
	.finally(async () => {
		// client is null when an argument/folder guard failed — nothing to
		// close. Otherwise close and swallow close's own error.
		await client?.close().catch(() => {})
	})
```

- [ ] **Step 2: Add the `restore` script to `package.json`**

Insert directly after the `"backup"` line added in Task 1:

```json
		"backup": "tsx --env-file=.env scripts/backup-mongo.ts",
		"restore": "tsx --env-file=.env scripts/restore-mongo.ts",
```

- [ ] **Step 3: Verify guard A — wrong key fails instantly**

```bash
bun run restore -- --key definitely-wrong --from 2099-01-01 --uri mongodb://localhost:27017/tgaw 2>&1; echo "exit=$?"
```

Expected: `[ERROR] Missing or invalid --key (expected --key <DB_BACKUP_KEY> from .env)` and `exit=1`, under a second.

- [ ] **Step 4: Verify guard B — missing `--from`**

```bash
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
bun run restore -- --key "$KEY" 2>&1; echo "exit=$?"
```

Expected: `[ERROR] Missing --from <folder> (a folder name under db_backup/)` and `exit=1`.

- [ ] **Step 5: Verify guard C — missing `--uri`**

```bash
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
bun run restore -- --key "$KEY" --from 2099-01-01 2>&1; echo "exit=$?"
```

Expected: `[ERROR] Missing --uri <target mongo connection string, incl. database name>` and `exit=1`.

- [ ] **Step 6: Verify folder validation — nonexistent dump folder fails before connecting**

```bash
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
bun run restore -- --key "$KEY" --from no-such-folder --uri mongodb://localhost:27017/tgaw 2>&1; echo "exit=$?"
```

Expected: `[ERROR] Dump folder not found: .../db_backup/no-such-folder` and `exit=1`. Must return in under a second — if it hangs, the script tried to connect and the validation order is wrong.

- [ ] **Step 7: Format the new file**

```bash
bunx prettier --write scripts/restore-mongo.ts
```

Expected: prints `scripts/restore-mongo.ts <time>ms` (only that file).

- [ ] **Step 8: Typecheck**

```bash
bun run typecheck
```

Expected: no output, exit 0.

- [ ] **Step 9: Lint (baseline must not grow)**

```bash
bun run lint 2>&1 | tail -3
bun run lint 2>&1 | grep "restore-mongo" || echo "no problems in restore-mongo.ts"
```

Expected: `✖ 39 problems (19 errors, 20 warnings)` (identical to baseline) and `no problems in restore-mongo.ts`.

- [ ] **Step 10: Commit (commits approved by user)**

```bash
git add scripts/restore-mongo.ts package.json
git commit -m "feat: add key-guarded MongoDB restore script"
```

---

### Task 3: Final verification

**Files:**
- Create: none
- Modify: none

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: verified working tree ready for the user's review.

- [ ] **Step 1: Full typecheck**

```bash
bun run typecheck
```

Expected: no output, exit 0.

- [ ] **Step 2: Full lint vs baseline**

```bash
bun run lint 2>&1 | tail -3
```

Expected: `✖ 39 problems (19 errors, 20 warnings)` — exactly the pre-existing baseline; no increase.

- [ ] **Step 3: Confirm the intended file set only**

```bash
git status --porcelain
```

Expected (only pre-existing, unrelated work remains uncommitted — our scripted files are committed):
```
 M lib/auth.ts
?? docs/superpowers/plans/2026-09-26-mongo-backup-restore.md
?? docs/superpowers/specs/2026-09-26-mongo-backup-restore-design.md
?? lib/db/mongoRecovery.test.ts
?? lib/db/mongoRecovery.ts
```
(`lib/auth.ts` + `lib/db/mongoRecovery*` are a pre-existing, unrelated fix left uncommitted by prior work — do not touch them. `.env`, `db_backup/`, and `scripts/` must NOT appear in the output.)

- [ ] **Step 4: Confirm backups are ignored and env is clean**

```bash
git check-ignore db_backup/ && git check-ignore .env && echo OK
```

Expected: prints both paths, then `OK`.

- [ ] **Step 5: Re-run the backup smoke once to prove idempotence**

```bash
KEY=$(grep '^DB_BACKUP_KEY=' .env | cut -d= -f2-)
bun run backup -- --key "$KEY" 2>&1 | tail -2
```

Expected: `[INFO] Backup complete. ...` and `[INFO] Output: ...` with exit 0 (re-running the same day overwrites that day's folder — by design).

- [ ] **Step 6: Report to the user**

Summarize: files added/changed, guard-test results, smoke-run doc/collection totals, and the remaining manual step (user runs `bun run restore` against a live target when one is available).
