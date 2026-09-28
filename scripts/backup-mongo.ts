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
// filesystem API. We use `rm` to clear out any previous run's output for
// today, `mkdir` to create the output directory, and `writeFile` to save
// each collection's EJSON file.
import { mkdir, rm, writeFile } from "node:fs/promises"

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
  // Clear today's folder BEFORE creating it, so every run starts from an
  // empty directory and the folder always contains exactly ONE run's
  // files. Without the wipe, two same-day runs could mix: a collection
  // dropped or renamed between runs left its stale <Old>.json behind
  // (restore would recreate a collection the source no longer has), and a
  // run that crashed mid-loop left old files sitting next to the previous
  // run's _indexes.json — a "complete-looking" but non-atomic dump that
  // restore would happily accept. After the wipe, a crash leaves either
  // no folder or a folder without _indexes.json, which restore's Guard D
  // rejects outright. `force: true` means "don't error if it's missing".
  await rm(outDir, { recursive: true, force: true })

  // Make sure the output directory exists. `recursive: true` means
  // "create the directory and any missing parents, and don't error if it
  // already exists".
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
      "utf8"
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
    "utf8"
  )
  console.log(`[INFO] Index definitions -> ${join(outDir, "_indexes.json")}`)

  console.log(
    `[INFO] Backup complete. ${totalDocs} documents across ${collections.length} collections.`
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
