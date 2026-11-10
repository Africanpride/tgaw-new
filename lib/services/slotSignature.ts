import { prisma } from "@/lib/db/prisma";

/** Count + latest updatedAt of the user's upcoming bookings. */
export async function getSlotSignature(userId: string) {
	const today = new Date().toISOString().split("T")[0];
	const where = { bookedBy: userId, date: { gte: today } };
	const [latest, count] = await Promise.all([
		prisma.slot.findFirst({
			where,
			orderBy: { updatedAt: "desc" },
			select: { updatedAt: true },
		}),
		prisma.slot.count({ where }),
	]);
	const latestIso = latest?.updatedAt.toISOString() ?? null;
	return { signature: `${count}:${latestIso ?? "none"}`, count, latest: latestIso };
}
