import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  try {
    const links = await prisma.meetingLink.findMany({ take: 10 });
    console.log("MeetingLink count:", links.length);
    for (const l of links) {
      console.log(`  ${l.type} | ${l.date} | ${l.url} | ${l.label}`);
    }
    const slots = await prisma.slot.findMany({ take: 5, orderBy: { date: "desc" } });
    console.log("\nRecent slots:", slots.length);
    for (const s of slots) {
      console.log(`  ${s.type} | ${s.date} | bookedBy=${s.bookedBy}`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
