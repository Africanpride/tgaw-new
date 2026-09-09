import { MongoClient } from "mongodb"

const uri = process.env.DATABASE_URL!
if (!uri) throw new Error("DATABASE_URL missing")

async function main() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()
  // Better Auth Verification collection is "verification" (lowercase)
  const col = db.collection("verification")
  const indexes = await col.indexes()
  const hasTTL = indexes.some((idx) => idx.key && "expiresAt" in idx.key && idx.expireAfterSeconds === 0)
  if (hasTTL) {
    console.log("Verification TTL index already exists on expiresAt")
  } else {
    console.log("Creating TTL index on verification.expiresAt (expireAfterSeconds: 0)...")
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true })
    console.log("Created TTL index for Verification")
  }
  // Ensure AuditLog TTL as well (idempotent)
  const auditCol = db.collection("AuditLog")
  const auditIdx = await auditCol.indexes().catch(() => [])
  const hasAuditTTL = auditIdx.some((idx: { key?: Record<string, unknown>; expireAfterSeconds?: number }) => idx.key && "expiresAt" in idx.key && idx.expireAfterSeconds === 0)
  if (!hasAuditTTL) {
    console.log("Creating TTL index on AuditLog.expiresAt...")
    await auditCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true })
    console.log("Created AuditLog TTL")
  }
  await client.close()
  console.log("Done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
