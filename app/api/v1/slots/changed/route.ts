import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight "did my upcoming slots change?" check.
 * Returns a signature (count + latest updatedAt) of the signed-in user's
 * upcoming bookings. The client polls this and only triggers router.refresh()
 * when the signature changes — so the assigned user's open views update
 * without a manual reload and without refetching the whole page on a timer.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);
	}

	try {
		const today = new Date().toISOString().split("T")[0];
		const latest = await prisma.slot.findFirst({
			where: {
				bookedBy: session.user.id,
				date: { gte: today },
			},
			orderBy: { updatedAt: "desc" },
			select: { updatedAt: true },
		});
		const count = await prisma.slot.count({
			where: {
				bookedBy: session.user.id,
				date: { gte: today },
			},
		});

		const signature = `${count}:${latest?.updatedAt.toISOString() ?? "none"}`;
		return NextResponse.json({
			success: true,
			data: { signature, count, latest: latest?.updatedAt.toISOString() ?? null },
		});
	} catch (error: unknown) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}