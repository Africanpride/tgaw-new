import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createMessageSchema } from "@/lib/schemas/messageSchema";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { searchParams } = new URL(req.url);
	const conversationId = searchParams.get("conversationId");
	const limit = Number(searchParams.get("limit")) || 50;
	const cursor = searchParams.get("cursor");

	const where: Record<string, unknown> = conversationId
		? { conversationId, deletedAt: null }
		: { conversation: { memberIds: { has: session.user.id! } }, deletedAt: null };

	if (cursor) {
		where.createdAt = { lt: new Date(cursor) };
	}

	const messages = await prisma.message.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit,
		include: {
			reactions: {
				select: { id: true, userId: true, emoji: true },
			},
			replyTo: {
				select: { id: true, body: true, senderId: true, createdAt: true },
			},
		},
	});

	// Mark messages as read by current user
	if (conversationId) {
		const unreadMessages = await prisma.message.findMany({
			where: {
				conversationId,
				senderId: { not: session.user.id! },
			},
			select: { id: true, readBy: true },
		});

		const toMark = unreadMessages.filter((m) => !m.readBy.includes(session.user.id!));
		if (toMark.length > 0) {
			await Promise.all(
				toMark.map((msg) =>
					prisma.message.update({
						where: { id: msg.id },
						data: { readBy: { push: session.user.id! } },
					})
				)
			);
		}
	}

	return NextResponse.json({ success: true, data: messages });
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const body = await req.json();
	const validation = createMessageSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	const message = await prisma.message.create({
		data: {
			...validation.data,
			senderId: session.user.id!,
			readBy: [session.user.id!],
		},
		include: {
			reactions: {
				select: { id: true, userId: true, emoji: true },
			},
			replyTo: {
				select: { id: true, body: true, senderId: true, createdAt: true },
			},
		},
	});

	return NextResponse.json({ success: true, data: message }, { status: 201 });
}
