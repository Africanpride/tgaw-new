import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createMessageSchema } from "@/lib/schemas/messageSchema";
import { getIO } from "@/lib/socket/server";

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
			// Broadcast read receipt to other clients
			const io = getIO();
			if (io) {
				const readPayload = {
					conversationId,
					userId: session.user.id!,
					messageIds: toMark.map((m) => m.id),
				};
				io.to(conversationId).emit("message:read", readPayload);
				prisma.conversation
					.findUnique({
						where: { id: conversationId },
						select: { memberIds: true },
					})
					.then((conv) => {
						if (conv?.memberIds) {
							for (const mId of conv.memberIds) {
								io.to(`user:${mId}`).emit("message:read", readPayload);
								io.to(mId).emit("message:read", readPayload);
							}
						}
					})
					.catch(() => {});
			}
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

	// Broadcast to other clients in the conversation and user rooms
	const io = getIO();
	if (io) {
		const roomSockets = (io as unknown as { sockets: { adapter: { rooms: Map<string, Set<string>> } } }).sockets.adapter.rooms.get(message.conversationId);
		console.log(`[SOCKET] Broadcasting message:new to room ${message.conversationId} (${roomSockets?.size ?? 0} sockets)`);
		io.to(message.conversationId).emit("message:new", message);

		// Broadcast to all conversation members' user rooms so inbox/list views receive the update in real time
		prisma.conversation
			.findUnique({
				where: { id: message.conversationId },
				select: { memberIds: true },
			})
			.then((conv) => {
				if (conv?.memberIds) {
					for (const mId of conv.memberIds) {
						io.to(`user:${mId}`).emit("message:new", message);
						io.to(mId).emit("message:new", message);
					}
				}
			})
			.catch((err) => console.error("[SOCKET] Failed to broadcast message:new to user rooms:", err));
	} else {
		console.error("[SOCKET] getIO() returned null — broadcast SKIPPED");
	}

	return NextResponse.json({ success: true, data: message }, { status: 201 });
}
