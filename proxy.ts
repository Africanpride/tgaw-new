import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Strip a leading /{locale} prefix so locale-prefixed public URLs reuse the
// same auth/onboarding guards as their unprefixed (default-locale) forms.
const LOCALE_PREFIX_RE = /^\/(en|fr|es|pt)(?=\/|$)/;
function stripLocalePrefix(path: string): string {
	return path.replace(LOCALE_PREFIX_RE, "") || "/";
}

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

// Simple in-memory rate limit for auth endpoints (works on single instance / dev; for Vercel scale use Upstash Redis via secondaryStorage in lib/auth.ts)
const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  "/api/auth/sign-in": { windowMs: 600_000, max: 5 },
  "/api/auth/sign-up": { windowMs: 3_600_000, max: 3 },
  "/api/auth/request-password-reset": { windowMs: 3_600_000, max: 3 },
  "/api/auth/verify-email": { windowMs: 3_600_000, max: 5 },
  "/api/auth/two-factor/verify": { windowMs: 300_000, max: 5 },
}
const rateLimitStore = new Map<string, { count: number; reset: number }>()
function isRateLimited(ip: string, path: string): { limited: boolean; retryAfter: number } {
  const key = Object.keys(RATE_LIMITS).find((k) => path.startsWith(k))
  if (!key) return { limited: false, retryAfter: 0 }
  const { windowMs, max } = RATE_LIMITS[key]!
  const storeKey = `${ip}:${key}`
  const now = Date.now()
  const entry = rateLimitStore.get(storeKey)
  if (!entry || now > entry.reset) {
    rateLimitStore.set(storeKey, { count: 1, reset: now + windowMs })
    return { limited: false, retryAfter: 0 }
  }
  if (entry.count >= max) {
    return { limited: true, retryAfter: Math.ceil((entry.reset - now) / 1000) }
  }
  entry.count++
  return { limited: false, retryAfter: 0 }
}
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

// Cookie consent — Vary on GPC + geo so CDN caches per region correctly
function withConsentHeaders(res: NextResponse, req: NextRequest): NextResponse {
	const gpc = req.headers.get("sec-gpc") === "1" || req.headers.get("Sec-GPC") === "1";
	const country =
		req.headers.get("x-vercel-ip-country") ??
		req.headers.get("cf-ipcountry") ??
		req.headers.get("CF-IPCountry") ??
		req.headers.get("x-country") ??
		""
	// Signal to client / CDN what was seen — no PII, just bucket hint
	if (country) res.headers.set("x-tgaw-country", country.toUpperCase());
	if (gpc) res.headers.set("x-tgaw-gpc", "1");
	// Vary so caches don’t collapse consent variants
	const vary = res.headers.get("Vary");
	const needed = "Sec-GPC, X-Vercel-IP-Country, CF-IPCountry";
	res.headers.set("Vary", vary ? `${vary}, ${needed}` : needed);
	return res;
}

export async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname;
	const barePath = stripLocalePrefix(path);
	const isApi = path.startsWith("/api/")
	const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p)) || path.startsWith("/api/v1/slots/");
	const isAuthPage = AUTH_PAGES.some((p) => barePath.startsWith(p));
	const isOnboardingPath = barePath.startsWith(ONBOARDING_PATH);
	const isBannedPath = barePath.startsWith(BANNED_PATH);
	const isStaticAsset =
		path.startsWith("/_next") ||
		path.startsWith("/images/") ||
		/\/[^/]+\.[a-z0-9]+$/i.test(path);

	// Rate-limit auth endpoints (Vercel or self-hosted) — 429 with Retry-After
	if (path.startsWith("/api/auth/")) {
		const ip = getClientIp(req)
		const { limited, retryAfter } = isRateLimited(ip, path)
		if (limited) {
			// Log suspicious burst fire-and-forget
			void (async () => {
				try {
					const { logAudit } = await import("@/lib/services/auditService")
					await logAudit({
						actorId: ip,
						action: "AUTH_LOGIN_FAILURE",
						targetType: "Auth",
						targetId: path,
						metadata: { reason: "rate_limit", path, ip },
						ip,
						userAgent: req.headers.get("user-agent") ?? null,
					})
				} catch {}
			})()
			const res = NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
			res.headers.set("Retry-After", String(retryAfter))
			return withConsentHeaders(res, req)
		}
	}

	const session = await auth.api.getSession({ headers: req.headers });

	// Banned users are locked out of everything except the banned page
	const isBanned = !!session && !!(session.user as { banned?: boolean }).banned;
	if (isBanned && !isBannedPath) {
		return withConsentHeaders(NextResponse.redirect(new URL(BANNED_PATH, req.url)), req);
	}
	// /banned is public (banned users have no session), but signed-in
	// non-banned users get bounced back to the dashboard.
	if (isBannedPath && session && !isBanned) {
		return withConsentHeaders(NextResponse.redirect(new URL("/overview", req.url)), req);
	}
	if (isBannedPath && !session) {
		return withConsentHeaders(NextResponse.next(), req);
	}

	if (isAuthPage && session) {
		// Check if onboarding is complete by looking for a UserProfile
		const profile = await prisma.userProfile.findUnique({
			where: { userId: session.user.id! },
		});
		if (!profile) {
			return withConsentHeaders(NextResponse.redirect(new URL(ONBOARDING_PATH, req.url)), req);
		}
		return withConsentHeaders(NextResponse.redirect(new URL("/overview", req.url)), req);
	}

	if (!isProtected && !isOnboardingPath) {
		// Public pages (landing, auth, legal): delegate locale detection,
		// prefix routing, and cookie setting to next-intl. Dashboard (protected),
		// onboarding, and API routes use cookie-based locale instead — no URL prefix.
		if (!isApi && !isStaticAsset) return withConsentHeaders(intlMiddleware(req), req);
		return withConsentHeaders(NextResponse.next(), req);
	}

	if (!session) {
		if (isApi) return withConsentHeaders(NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 }), req)
		return withConsentHeaders(NextResponse.redirect(new URL("/login", req.url)), req);
	}

	// Onboarding guard — redirect to /setup if no UserProfile exists
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id! },
	});
	if (!profile && !isOnboardingPath) {
		return withConsentHeaders(NextResponse.redirect(new URL(ONBOARDING_PATH, req.url)), req);
	}
	if (profile && isOnboardingPath) {
		return withConsentHeaders(NextResponse.redirect(new URL("/overview", req.url)), req);
	}

	const role = (session.user.role as string) || "member";

	// superadmin short-circuit (passes all RBAC checks)
	if (role === "superadmin") {
		return withConsentHeaders(NextResponse.next(), req);
	}

	if (path.startsWith("/api/v1/slots/book") || path.startsWith("/api/v1/slots/cancel") || path === "/api/v1/slots") {
		// All authenticated users can list/book/cancel
	} else if (path.startsWith("/api/v1/slots/assign") || path.startsWith("/api/v1/slots/admin-cancel") || path.startsWith("/api/v1/slots/config") || path.startsWith("/api/v1/slots/meeting-link") || path.startsWith("/api/v1/slots/generate")) {
		// leader, superadmin, and coordinator
		if (role !== "leader" && role !== "superadmin" && role !== "coordinator") {
			return withConsentHeaders(isApi ? NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/unauthorized", req.url)), req);
		}
	}

	// User Management / Role Assignment: superadmin only
	if (SUPERADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
		return withConsentHeaders(isApi ? NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/unauthorized", req.url)), req);
	}

	// Admin Portal (slot admin, reports, external links, etc.): leader + superadmin
	if (ADMIN_PORTAL_PATHS.some((p) => path.startsWith(p)) && role !== "leader") {
		return withConsentHeaders(isApi ? NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/unauthorized", req.url)), req);
	}

	// Coordinator Dashboard: coordinator + superadmin
	if (COORDINATOR_PATHS.some((p) => path.startsWith(p)) && role !== "coordinator") {
		return withConsentHeaders(isApi ? NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/unauthorized", req.url)), req);
	}

	// Board Dashboard: board + superadmin
	if (BOARD_PATHS.some((p) => path.startsWith(p)) && role !== "board") {
		return withConsentHeaders(isApi ? NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/unauthorized", req.url)), req);
	}

	return withConsentHeaders(NextResponse.next(), req);
}
