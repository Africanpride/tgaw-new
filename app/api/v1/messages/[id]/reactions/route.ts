import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { reactionSchema } from "@/lib/schemas/messageSchema";

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

	// Check if reaction already exists (toggle)
	const existing = await prisma.messageReaction.findUnique({
		where: { messageId_userId_emoji: { messageId: id, userId, emoji } },
	});

	if (existing) {
		await prisma.messageReaction.delete({ where: { id: existing.id } });
		return NextResponse.json({ success: true, data: { action: "removed" } });
	}

	await prisma.messageReaction.create({
		data: { messageId: id, userId, emoji },
	});

	return NextResponse.json({ success: true, data: { action: "added" } });
}
