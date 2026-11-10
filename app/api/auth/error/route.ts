import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const error = searchParams.get("error");
	const description = searchParams.get("error_description");

	// Banned users are routed to the banned page
	if (error === "BANNED_USER") {
		const url = new URL("/banned", req.url);
		if (description) url.searchParams.set("reason", description);
		return NextResponse.redirect(url);
	}

	// Any other auth error returns to sign-in with the error code surfaced
	// so the login page can show it instead of failing silently.
	const url = new URL("/login", req.url);
	if (error) url.searchParams.set("authError", error);
	return NextResponse.redirect(url);
}