import { MongoClient } from "mongodb"
const uri = process.env.DATABASE_URL!
const c = new MongoClient(uri)
await c.connect()
const db = c.db()
const col = db.collection("verification")
const idxs = await col.indexes()
console.log(JSON.stringify(idxs, null, 2))
await c.close()
