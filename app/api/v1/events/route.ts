import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createEventSchema } from "@/lib/schemas/eventSchema";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { searchParams } = new URL(req.url);
	const date = searchParams.get("date");
	const type = searchParams.get("type");

	const { limit = "20", cursor } = Object.fromEntries(searchParams);
	const take = Math.min(Number(limit), 100);
	const events = await prisma.event.findMany({
		where: {
			userId: session.user.id!,
			...(date ? { date } : {}),
			...(type ? { type: type as "BIBLE" | "PRAYER" | "PRAISE_WORSHIP" } : {}),
		},
		orderBy: { time: "asc" },
		take: take + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
	});
	const hasMore = events.length > take;
	const data = hasMore ? events.slice(0, take) : events;
	return NextResponse.json({
		success: true,
		data,
		nextCursor: hasMore ? data[data.length - 1]?.id : null,
	});
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const body = await req.json();
	const validation = createEventSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	const event = await prisma.event.create({
		data: { ...validation.data, userId: session.user.id! },
	});
	return NextResponse.json({ success: true, data: event }, { status: 201 });
}
