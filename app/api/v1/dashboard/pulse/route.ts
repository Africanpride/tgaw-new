import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMobileDockCounts } from "@/lib/mobileDock";
import { getSlotSignature } from "@/lib/services/slotSignature";

export const dynamic = "force-dynamic";

/**
 * One request that replaces the separate /mobile-dock and /slots/changed polls:
 * one getSession, one invocation, queries run in parallel.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
	}
	const userId = session.user.id!;
	try {
		const [dock, slots] = await Promise.all([getMobileDockCounts(userId), getSlotSignature(userId)]);
		return NextResponse.json(
			{ success: true, data: { dock, slots } },
			{ headers: { "Cache-Control": "private, no-store" } },
		);
	} catch (error: unknown) {
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}
