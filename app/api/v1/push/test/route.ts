import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { sendPush } from "@/lib/notifications/push";

export async function POST() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
	}

	const subs = await prisma.pushSubscription.findMany({
		where: { userId: session.user.id },
	});

	if (subs.length === 0) {
		return NextResponse.json(
			{ success: false, error: "No push subscriptions for this user" },
			{ status: 404 },
		);
	}

	let sent = 0;
	let failed = 0;
	const errors: string[] = [];

	for (const sub of subs) {
		try {
			await sendPush(
				{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
				"TGAW test notification",
				"This is a test push from The Global Altar Watch. If you can read this, push is working!",
			);
			sent++;
		} catch (e) {
			failed++;
			const msg = e instanceof Error ? e.message : String(e);
			errors.push(`${sub.endpoint.slice(-12)}: ${msg}`);
			// 404/410 = subscription expired/gone — clean it up
			if (msg.includes("404") || msg.includes("410")) {
				await prisma.pushSubscription
					.delete({ where: { endpoint: sub.endpoint } })
					.catch(() => {});
			}
		}
	}

	if (sent === 0) {
		return NextResponse.json(
			{ success: false, error: `All pushes failed: ${errors.join("; ")}` },
			{ status: 502 },
		);
	}

	return NextResponse.json({ success: true, data: { sent, failed } });
}
