import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSlotSignature } from "@/lib/services/slotSignature";

export const dynamic = "force-dynamic";

/**
 * Lightweight "did my upcoming slots change?" check. Kept for backwards
 * compatibility — the dashboard now uses /api/v1/dashboard/pulse.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
	}
	try {
		return NextResponse.json({ success: true, data: await getSlotSignature(session.user.id!) });
	} catch (error: unknown) {
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}
