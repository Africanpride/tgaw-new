import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { searchParams } = new URL(req.url);
	const username = (searchParams.get("username") ?? "").trim().toLowerCase();

	if (username.length < 3) {
		return NextResponse.json({ success: true, data: { available: false } });
	}

	const existing = await prisma.user.findUnique({ where: { username } });
	return NextResponse.json({ success: true, data: { available: !existing } });
}
