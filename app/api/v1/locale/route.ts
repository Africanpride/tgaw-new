import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	isLocale,
	type Locale,
} from "@/i18n/config";

const localeBodySchema = z.object({
	locale: z.enum(["en", "fr", "es", "pt"]),
});

export async function GET(req: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: req.headers });
		if (!session?.user)
			return NextResponse.json(
				{ success: false, data: null, error: "Unauthorised" },
				{ status: 401 },
			);

		const cookieStore = await cookies();
		const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

		let preferred: string | null = null;
		try {
			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { preferredLocale: true },
			});
			preferred =
				typeof user?.preferredLocale === "string"
					? user.preferredLocale
					: null;
		} catch {
			preferred = null;
		}

		const locale: Locale =
			preferred && isLocale(preferred)
				? preferred
				: cookieLocale && isLocale(cookieLocale)
					? cookieLocale
					: DEFAULT_LOCALE;

		return NextResponse.json({ success: true, data: { locale }, error: null });
	} catch (error: unknown) {
		console.error(
			"[ERROR] GET /api/v1/locale",
			error instanceof Error ? error.message : String(error),
		);
		return NextResponse.json(
			{ success: false, data: null, error: "Failed to fetch locale" },
			{ status: 500 },
		);
	}
}

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, data: null, error: "Unauthorised" },
			{ status: 401 },
		);

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json(
			{ success: false, data: null, error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const validation = localeBodySchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, data: null, error: validation.error.format() },
			{ status: 400 },
		);

	const { locale } = validation.data;

	try {
		await prisma.user.update({
			where: { id: session.user.id },
			data: { preferredLocale: locale },
		});
	} catch (error: unknown) {
		// Tolerate a missing column on DBs that haven't run `prisma db push`
		// yet (e.g. P2022 unknown field) — the cookie still persists the choice.
		console.error(
			"[ERROR] PATCH /api/v1/locale db update",
			error instanceof Error ? error.message : String(error),
		);
	}

	const cookieStore = await cookies();
	cookieStore.set(LOCALE_COOKIE_NAME, locale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	return NextResponse.json({
		success: true,
		data: { locale },
		error: null,
	});
}
