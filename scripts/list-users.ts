import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Use raw MongoDB query via Prisma's $runCommandRaw
const result = await prisma.$runCommandRaw({
  find: "user",
  projection: { email: 1, name: 1, role: 1 },
});

const users = (result as any).cursor.firstBatch;
console.log(JSON.stringify(users, null, 2));

await prisma.$disconnect();
