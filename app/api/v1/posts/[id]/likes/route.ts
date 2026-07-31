import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(
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

	const existing = await prisma.like.findUnique({
		where: {
			targetType_targetId_userId: {
				targetType: "POST",
				targetId: id,
				userId: session.user.id!,
			},
		},
	});

	if (existing) {
		await prisma.like.delete({ where: { id: existing.id } });
		return NextResponse.json({ success: true, data: { liked: false } });
	}

	const post = await prisma.post.findUnique({ where: { id } });
	if (!post)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	await prisma.like.create({
		data: {
			postId: id,
			targetType: "POST",
			targetId: id,
			userId: session.user.id!,
		},
	});

	return NextResponse.json({ success: true, data: { liked: true } });
}
