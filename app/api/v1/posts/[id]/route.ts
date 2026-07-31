import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { updatePostSchema } from "@/lib/schemas/postSchema";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const post = await prisma.post.findUnique({
		where: { id },
		include: {
			poll: { include: { options: true } },
			_count: { select: { comments: true, likes: true } },
		},
	});
	if (!post)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);
	return NextResponse.json({ success: true, data: post });
}

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
	const body = await req.json();
	const validation = updatePostSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	const post = await prisma.post.update({
		where: { id },
		data: validation.data,
	});
	return NextResponse.json({ success: true, data: post });
}

export async function DELETE(
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
	await prisma.post.delete({ where: { id } });
	return NextResponse.json({ success: true, data: null });
}
