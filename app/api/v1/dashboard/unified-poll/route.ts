import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMobileDockCounts } from "@/lib/mobileDock";
import { getSlotSignature } from "@/lib/services/slotSignature";
import { touchPresence, getOnlineUserIds } from "@/lib/services/presence";
import { getCommunityActivity } from "@/lib/services/activityService";

export const dynamic = "force-dynamic";

/**
 * Unified poll endpoint — replaces 5 separate polls (pulse, heartbeat,
 * presence list, activity, nav-user zoom) with ONE invocation.
 *
 * Side-effects:
 * - Automatically touches presence heartbeat for the authenticated user,
 *   completely eliminating standalone heartbeat POSTs.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
	}
	const userId = session.user.id;
	try {
		// Fire all queries + presence heartbeat in parallel
		const [dock, slots, , onlineIds, activity] = await Promise.all([
			getMobileDockCounts(userId),
			getSlotSignature(userId),
			touchPresence(userId), // side-effect: heartbeat
			getOnlineUserIds(),
			getCommunityActivity(8),
		]);
		return NextResponse.json(
			{
				success: true,
				data: { dock, slots, onlineIds, activity },
			},
			{ headers: { "Cache-Control": "private, no-store" } },
		);
	} catch (error: unknown) {
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

