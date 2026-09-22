import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { editMessageSchema } from "@/lib/schemas/messageSchema";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { id } = await params;
	const body = await req.json();
	const validation = editMessageSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });

	const message = await prisma.message.findUnique({ where: { id } });
	if (!message)
		return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
	if (message.senderId !== session.user.id)
		return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

	const updated = await prisma.message.update({
		where: { id },
		data: { body: validation.data.body, editedAt: new Date() },
	});

	return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { id } = await params;
	const message = await prisma.message.findUnique({ where: { id } });
	if (!message)
		return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
	if (message.senderId !== session.user.id)
		return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

	await prisma.message.update({
		where: { id },
		data: { deletedAt: new Date(), body: "" },
	});

	return NextResponse.json({ success: true });
}
