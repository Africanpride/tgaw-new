import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const createReportSchema = z.object({
	targetType: z.enum(["POST", "COMMENT", "USER"]),
	targetId: z.string().min(1),
	reason: z.string().min(1, "Reason is required"),
});

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const role = (session.user.role as string) || "member";
	if (!["moderator", "admin"].includes(role))
		return NextResponse.json(
			{ success: false, error: "Forbidden" },
			{ status: 403 },
		);

	const reports = await prisma.report.findMany({
		where: { status: "OPEN" },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json({ success: true, data: reports });
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const body = await req.json();
	const validation = createReportSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	const report = await prisma.report.create({
		data: {
			...validation.data,
			reporterId: session.user.id!,
		},
	});

	return NextResponse.json({ success: true, data: report }, { status: 201 });
}
