import { MongoClient } from "mongodb";
import { PRESENCE_TTL_SECONDS } from "../lib/services/presence";

/**
 * One-time setup: create the raw MongoDB TTL index that auto-deletes stale
 * Presence rows (Prisma's MongoDB connector cannot declare TTL indexes).
 * Safe to re-run — createIndex is idempotent when the options match.
 *
 * Run: bunx tsx --env-file=.env scripts/presence-ttl.ts
 */
async function main() {
	const uri = process.env.DATABASE_URL;
	if (!uri) throw new Error("DATABASE_URL is not set");

	const client = new MongoClient(uri);
	await client.connect();
	try {
		const db = client.db();
		const result = await db
			.collection("Presence")
			.createIndex({ lastSeenAt: 1 }, { expireAfterSeconds: PRESENCE_TTL_SECONDS });
		console.log(`[presence-ttl] ensured index: ${result}`);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error("[ERROR] presence-ttl failed:", error);
	process.exit(1);
});
