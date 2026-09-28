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
import {
  BSON,
  type Document,
  type IndexDescription,
  MongoClient,
} from "mongodb"

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
  console.error(
    "[ERROR] Missing --from <folder> (a folder name under db_backup/)"
  )
  process.exit(1)
}

// Guard C: --uri is the TARGET connection string, including the database
// name (e.g. mongodb://localhost:27017/tgaw). This is the only database
// this script will ever touch.
const uri = getArg("--uri")
if (!uri) {
  console.error(
    "[ERROR] Missing --uri <target mongo connection string, incl. database name>"
  )
  process.exit(1)
}

// The client is created here (unopened) so the module-level cleanup below
// can always close it, but no network traffic happens until connect().
let client: MongoClient | null = null

// ---------------------------------------------------------------------------
// Step 2: main() — validate folder, wipe target, load dump, rebuild indexes
// ---------------------------------------------------------------------------
// `from` and `uri` are passed as parameters (they are already validated to
// be strings by the guards above): TypeScript closures only see the
// declared `string | undefined` type of a module-level const, so passing
// them in keeps main() fully type-safe without repeating the guards.
async function main(from: string, uri: string): Promise<void> {
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

  // Collection files are <name>.json; _indexes.json is not a collection
  // (it is parsed pre-connect by Guard E below; only the index
  // recreation happens after the load).
  const files = entries
    .filter((name) => name.endsWith(".json") && name !== "_indexes.json")
    .sort()
  if (files.length === 0) {
    console.error(`[ERROR] No <collection>.json files found in ${dumpDir}`)
    process.exit(1)
    return
  }

  // Guard D: a complete backup always contains _indexes.json (the backup
  // writes it after the collections). A folder without it means the dump
  // crashed part-way — restoring only the data would silently lose every
  // index, so a partial backup is rejected outright.
  if (!entries.includes("_indexes.json")) {
    console.error(
      `[ERROR] Missing _indexes.json in ${dumpDir} — refusing to restore a partial backup`
    )
    process.exit(1)
    return
  }

  // Guard E: read + parse _indexes.json BEFORE any connection is opened.
  // Guard D proved the file exists, so a failure here means it cannot be
  // read or parsed (e.g. truncated mid-write by a crashed backup).
  // Restoring anyway would wipe the target, load the data, and then be
  // unable to recreate a single index — losing every unique constraint —
  // so a corrupt file is rejected while the target is still untouched.
  const indexPath = join(dumpDir, "_indexes.json")
  let indexMap: Record<string, Document[]> = {}
  try {
    indexMap = BSON.EJSON.parse(await readFile(indexPath, "utf8"), {
      relaxed: false,
    }) as Record<string, Document[]>
  } catch {
    console.error(
      `[ERROR] Corrupt or unreadable _indexes.json in ${dumpDir} — refusing to restore a partial backup`
    )
    process.exit(1)
    return // unreachable in practice — process.exit never returns
  }

  // Guard F: read + parse EVERY <collection>.json BEFORE any connection is
  // opened, and keep the parsed documents in memory for the load loop.
  // The wipe below is destructive and irreversible, so the dump's contents
  // must be proven good first: a truncated/corrupt file found after the
  // drop would leave the target EMPTY (the exact partial-restore disaster
  // Guards D and E exist to prevent), and a file that parses to something
  // other than an array (e.g. `{"a": 1}`) would previously slip through
  // the `as Document[]` cast, log `undefined docs`, add `NaN` to the
  // total, and exit 0 — a silent "success" on a destructive operation.
  // The memory cost is the same as before: the load loop fully buffered
  // each file anyway, and the backup already holds a whole collection
  // in RAM while writing it.
  const collectionDocs = new Map<string, Document[]>()
  for (const file of files) {
    const name = file.slice(0, -".json".length)
    let parsed: unknown
    try {
      // `BSON.EJSON.parse(text, { relaxed: false })` reverses the backup:
      // {"$oid": ...} becomes a real ObjectId, {"$date": ...} a real Date,
      // {"$numberInt": ...} a real integer. Plain JSON.parse would leave
      // them as strings and the app would break on the restored data.
      parsed = BSON.EJSON.parse(await readFile(join(dumpDir, file), "utf8"), {
        relaxed: false,
      })
    } catch {
      console.error(
        `[ERROR] Corrupt or unreadable ${file} in ${dumpDir} — refusing to restore, target untouched`
      )
      process.exit(1)
      return // unreachable in practice — process.exit never returns
    }
    // Valid JSON that is not an array is just as fatal as corrupt JSON:
    // a backup only ever writes one EJSON array per collection file.
    if (!Array.isArray(parsed)) {
      console.error(
        `[ERROR] ${file} in ${dumpDir} is not a JSON array — refusing to restore, target untouched`
      )
      process.exit(1)
      return // unreachable in practice — process.exit never returns
    }
    collectionDocs.set(name, parsed as Document[])
  }

  // Guard F (continued): the parsed _indexes.json must also have the right
  // SHAPE, not merely parse. `[]`, `"str"`, or `5` are all valid JSON that
  // survives Guard E's parse, yet none is a map of collection -> index
  // list: `Object.entries` on them yields nothing, so the restore would
  // wipe the target, recreate ZERO indexes, and exit 0 as if it worked.
  // Reject a non-object, an array, or an object holding non-array values
  // while the target is still untouched.
  const rawIndexMap: unknown = indexMap
  if (
    typeof rawIndexMap !== "object" ||
    rawIndexMap === null ||
    Array.isArray(rawIndexMap) ||
    Object.values(rawIndexMap).some((value) => !Array.isArray(value))
  ) {
    console.error(
      `[ERROR] _indexes.json in ${dumpDir} is not a map of collection -> index list — refusing to restore, target untouched`
    )
    process.exit(1)
    return // unreachable in practice — process.exit never returns
  }

  // All guards passed: the dump is complete and every file parsed cleanly.
  // From here on the target database is fair game.
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
    `[INFO] Dropping ${existing.length} existing collection(s) before load...`
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
  // The documents were already read, parsed, and proven to be arrays by
  // Guard F above (before the drop), so this loop only writes them.
  let totalDocs = 0
  for (const [name, docs] of collectionDocs) {
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
  // (parsed pre-connect by Guard E above; only the creation happens here)
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
      // The specs are plain EJSON-parsed Documents; the driver's
      // createIndexes() wants IndexDescription (which mandates `key`),
      // so they are cast once here after the `_id_`/`ns` cleanup above.
      await db.collection(name).createIndexes(specs as IndexDescription[])
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
    `[INFO] Restore complete. ${totalDocs} documents across ${files.length} collections into "${db.databaseName}".`
  )
}

// ---------------------------------------------------------------------------
// Step 3: Run main(), catch any error, and always close the connection
// ---------------------------------------------------------------------------
main(from, uri)
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
