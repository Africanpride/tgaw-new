import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
	console.log("Usage: bun run set-member <email>");
	process.exit(1);
}

// Find user via raw MongoDB
const findResult = await prisma.$runCommandRaw({
	find: "user",
	filter: { email },
	limit: 1,
});

const users = (findResult as any).cursor.firstBatch;

if (!users || users.length === 0) {
	console.log(`No user found with email: ${email}`);
	process.exit(1);
}

const user = users[0];

// Update role via raw MongoDB
await prisma.$runCommandRaw({
	update: "user",
	updates: [{ q: { email }, u: { $set: { role: "member" } } }],
});

console.log(`Updated ${email} (${user.name || "unknown"}) to member role`);
await prisma.$disconnect();
