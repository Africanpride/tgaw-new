import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATHS = [
	"/overview",
	"/bible",
	"/prayer",
	"/calendar",
	"/messages",
	"/worship",
	"/groups",
	"/settings",
	"/admin",
	"/feed",
	"/notifications",
	"/booking",
];

const ADMIN_ONLY_PATHS = ["/admin/users"];
const MODERATOR_PATHS = ["/admin"];

export async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname;
	const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
	if (!isProtected) return NextResponse.next();

	const session = await auth.api.getSession({ headers: req.headers });
	if (!session) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const role = (session.user.role as string) || "member";

	if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p)) && role !== "admin") {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	if (
		MODERATOR_PATHS.some((p) => path.startsWith(p)) &&
		!["moderator", "admin"].includes(role)
	) {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	return NextResponse.next();
}
