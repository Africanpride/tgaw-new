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

	// Any other auth error returns to sign-in
	return NextResponse.redirect(new URL("/login", req.url));
}