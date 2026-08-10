import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/notifications/email";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);
	}

	const userId = session.user.id!;

	const [
		posts,
		comments,
		likes,
		follows,
		events,
		bookings,
		messages,
		notifications,
		groups,
	] = await Promise.all([
		prisma.post.findMany({ where: { authorId: userId } }),
		prisma.comment.findMany({ where: { authorId: userId } }),
		prisma.like.findMany({ where: { userId } }),
		prisma.follow.findMany({
			where: { OR: [{ followerId: userId }, { followingId: userId }] },
		}),
		prisma.event.findMany({ where: { userId } }),
		prisma.eventBooking.findMany({ where: { userId } }),
		prisma.message.findMany({ where: { senderId: userId } }),
		prisma.notification.findMany({ where: { userId } }),
		prisma.groupMember.findMany({ where: { userId }, include: { group: true } }),
	]);

	const payload = {
		exportedAt: new Date().toISOString(),
		account: {
			id: userId,
			name: session.user.name,
			email: session.user.email,
			createdAt: session.user.createdAt?.toISOString() ?? null,
		},
		posts,
		comments,
		likes,
		follows,
		events,
		bookings,
		messages,
		notifications,
		groups: groups.map((g) => ({
			groupId: g.groupId,
			groupName: g.group.name,
			role: g.role,
			joinedAt: g.joinedAt,
		})),
	};

	const json = JSON.stringify(payload, null, 2);

	// Email the download link once (user can re-download from Settings).
	if (process.env.SMTP_HOST) {
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
		const link = `${baseUrl}/api/v1/account/export`;
		try {
			await sendEmail(
				session.user.email,
				"Your TGAW data export",
				`<p>We've prepared a copy of your TGAW data.</p><p>Download it here: <a href="${link}">${link}</a></p><p>You must be signed in on the device you open this link from.</p>`,
			);
		} catch (err) {
			console.error("[ERROR] Failed to email data export", err);
		}
	}

	return new NextResponse(json, {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Content-Disposition": `attachment; filename="tgaw-data-${userId}.json"`,
		},
	});
}