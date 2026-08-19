import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const SUPERADMIN_ONLY_PATHS = ["/admin/users"];
const ADMIN_PORTAL_PATHS = ["/admin"];
const COORDINATOR_PATHS = ["/coordinator"];
const BOARD_PATHS = ["/board"];

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
	"/coordinator",
	"/board",
	"/feed",
	"/notifications",
	"/booking",
];

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const ONBOARDING_PATH = "/onboarding";
const BANNED_PATH = "/banned";

export async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname;
	const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p)) || path.startsWith("/api/v1/slots/");
	const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
	const isOnboardingPath = path.startsWith(ONBOARDING_PATH);
	const isBannedPath = path.startsWith(BANNED_PATH);

	const session = await auth.api.getSession({ headers: req.headers });

	// Banned users are locked out of everything except the banned page
	const isBanned = !!session && !!(session.user as { banned?: boolean }).banned;
	if (isBanned && !isBannedPath) {
		return NextResponse.redirect(new URL(BANNED_PATH, req.url));
	}
	// /banned is public (banned users have no session), but signed-in
	// non-banned users get bounced back to the dashboard.
	if (isBannedPath && session && !isBanned) {
		return NextResponse.redirect(new URL("/overview", req.url));
	}
	if (isBannedPath && !session) {
		return NextResponse.next();
	}

	if (isAuthPage && session) {
		// Check if onboarding is complete by looking for a UserProfile
		const profile = await prisma.userProfile.findUnique({
			where: { userId: session.user.id! },
		});
		if (!profile) {
			return NextResponse.redirect(new URL(ONBOARDING_PATH, req.url));
		}
		return NextResponse.redirect(new URL("/overview", req.url));
	}

	if (!isProtected && !isOnboardingPath) return NextResponse.next();

	if (!session) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	// Onboarding guard — redirect to /setup if no UserProfile exists
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id! },
	});
	if (!profile && !isOnboardingPath) {
		return NextResponse.redirect(new URL(ONBOARDING_PATH, req.url));
	}
	if (profile && isOnboardingPath) {
		return NextResponse.redirect(new URL("/overview", req.url));
	}

	const role = (session.user.role as string) || "member";

	// superadmin short-circuit (passes all RBAC checks)
	if (role === "superadmin") {
		return NextResponse.next();
	}

	if (path.startsWith("/api/v1/slots/book") || path.startsWith("/api/v1/slots/cancel") || path === "/api/v1/slots") {
		// All authenticated users can list/book/cancel
	} else if (path.startsWith("/api/v1/slots/assign") || path.startsWith("/api/v1/slots/admin-cancel") || path.startsWith("/api/v1/slots/config") || path.startsWith("/api/v1/slots/meeting-link") || path.startsWith("/api/v1/slots/generate")) {
		// Only leader and superadmin
		if (role !== "leader" && role !== "superadmin") {
			return NextResponse.redirect(new URL("/unauthorized", req.url));
		}
	}

	// User Management / Role Assignment: superadmin only
	if (SUPERADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	// Admin Portal (slot admin, reports, external links, etc.): leader + superadmin
	if (ADMIN_PORTAL_PATHS.some((p) => path.startsWith(p)) && role !== "leader") {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	// Coordinator Dashboard: coordinator + superadmin
	if (COORDINATOR_PATHS.some((p) => path.startsWith(p)) && role !== "coordinator") {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	// Board Dashboard: board + superadmin
	if (BOARD_PATHS.some((p) => path.startsWith(p)) && role !== "board") {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	return NextResponse.next();
}
