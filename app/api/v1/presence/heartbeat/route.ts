import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { touchPresence } from "@/lib/services/presence";

export async function POST() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);
	}

	await touchPresence(session.user.id);
	return NextResponse.json({ success: true, data: { ok: true } });
}
