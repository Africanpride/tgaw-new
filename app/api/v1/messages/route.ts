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

	const where = conversationId
		? { conversationId }
		: { conversation: { memberIds: { has: session.user.id! } } };

	const messages = await prisma.message.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit,
	});

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
	});

	return NextResponse.json({ success: true, data: message }, { status: 201 });
}
