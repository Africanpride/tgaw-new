import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { reactionSchema } from "@/lib/schemas/messageSchema";
import { getIO } from "@/lib/socket/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { id } = await params;
	const reactions = await prisma.messageReaction.findMany({
		where: { messageId: id },
		select: { id: true, userId: true, emoji: true },
	});

	return NextResponse.json({ success: true, data: reactions });
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { id } = await params;
	const body = await req.json();
	const validation = reactionSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });

	const { emoji } = validation.data;
	const userId = session.user.id!;

	// Look up the message to get conversationId for broadcasting
	const targetMessage = await prisma.message.findUnique({
		where: { id },
		select: { conversationId: true },
	});
	if (!targetMessage)
		return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });

	// Check if reaction already exists (toggle)
	const existing = await prisma.messageReaction.findUnique({
		where: { messageId_userId_emoji: { messageId: id, userId, emoji } },
	});

	if (existing) {
		await prisma.messageReaction.delete({ where: { id: existing.id } });
		// Broadcast reaction removal
		const io = getIO();
		if (io) {
			const payload = {
				conversationId: targetMessage.conversationId,
				messageId: id,
				userId,
				emoji,
				action: "removed",
			};
			io.to(targetMessage.conversationId).emit("message:reaction", payload);
			prisma.conversation
				.findUnique({
					where: { id: targetMessage.conversationId },
					select: { memberIds: true },
				})
				.then((conv) => {
					if (conv?.memberIds) {
						for (const mId of conv.memberIds) {
							io.to(`user:${mId}`).emit("message:reaction", payload);
							io.to(mId).emit("message:reaction", payload);
						}
					}
				})
				.catch(() => {});
		}
		return NextResponse.json({ success: true, data: { action: "removed" } });
	}

	await prisma.messageReaction.create({
		data: { messageId: id, userId, emoji },
	});

	// Broadcast reaction addition
	const io = getIO();
	if (io) {
		const payload = {
			conversationId: targetMessage.conversationId,
			messageId: id,
			userId,
			emoji,
			action: "added",
		};
		io.to(targetMessage.conversationId).emit("message:reaction", payload);
		prisma.conversation
			.findUnique({
				where: { id: targetMessage.conversationId },
				select: { memberIds: true },
			})
			.then((conv) => {
				if (conv?.memberIds) {
					for (const mId of conv.memberIds) {
						io.to(`user:${mId}`).emit("message:reaction", payload);
						io.to(mId).emit("message:reaction", payload);
					}
				}
			})
			.catch(() => {});
	}

	return NextResponse.json({ success: true, data: { action: "added" } });
}
