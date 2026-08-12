import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

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

const ADMIN_ONLY_PATHS = ["/admin"];

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const ONBOARDING_PATH = "/onboarding";

export async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname;
	const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
	const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
	const isOnboardingPath = path.startsWith(ONBOARDING_PATH);

	const session = await auth.api.getSession({ headers: req.headers });

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

	const role = (session.user.role as string) || "member";

	if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p)) && role !== "admin") {
		return NextResponse.redirect(new URL("/unauthorized", req.url));
	}

	return NextResponse.next();
}
