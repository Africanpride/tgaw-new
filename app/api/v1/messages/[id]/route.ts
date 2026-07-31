import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { id } = await params;
	const message = await prisma.message.findUnique({ where: { id } });
	if (!message)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	const readBy = message.readBy.includes(session.user.id!)
		? message.readBy
		: [...message.readBy, session.user.id!];

	const updated = await prisma.message.update({
		where: { id },
		data: { readBy },
	});

	return NextResponse.json({ success: true, data: updated });
}
