import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const superadminEmails = (process.env.SUPERADMIN_EMAILS || "")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

if (superadminEmails.length === 0) {
	console.log("No emails configured in SUPERADMIN_EMAILS environment variable.");
	process.exit(1);
}

console.log(`Setting superadmin role for configured emails: ${superadminEmails.join(", ")}`);

for (const email of superadminEmails) {
	const findResult = await prisma.$runCommandRaw({
		find: "user",
		filter: { email: { $regex: `^${email}$`, $options: "i" } },
		limit: 1,
	});

	const users = (findResult as { cursor: { firstBatch: Array<{ _id: string | { $oid: string }; email?: string; name?: string }> } }).cursor.firstBatch;

	if (!users || users.length === 0) {
		console.log(`No user found with email: ${email}`);
		continue;
	}

	const user = users[0];

	await prisma.$runCommandRaw({
		update: "user",
		updates: [{ q: { _id: user._id }, u: { $set: { role: "superadmin" } } }],
	});

	console.log(`Updated ${email} (${user.name || "unknown"}) to superadmin role`);
}

await prisma.$disconnect();
