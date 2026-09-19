import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/i18n/config";

/**
 * Serves translation namespaces to the dashboard (react-i18next HttpBackend).
 * Single source of truth stays in /messages/{locale}/{namespace}.json.
 *
 * Unknown locale/namespace or missing file falls back to the default-locale
 * file; if that is missing too, an empty object is returned so the client
 * falls back to its inline keys instead of crashing.
 */
const NAMESPACES = [
	"common",
	"landing",
	"auth",
	"onboarding",
	"dashboard",
	"bible",
	"prayer",
	"worship",
	"calendar",
	"messages",
	"groups",
	"feed",
	"booking",
	"settings",
	"admin",
	"notifications",
	"legal",
	"errors",
] as const;

async function loadMessages(
	locale: string,
	namespace: string,
): Promise<Record<string, string>> {
	const file = path.join(
		process.cwd(),
		"messages",
		locale,
		`${namespace}.json`,
	);
	try {
		return JSON.parse(await readFile(file, "utf-8")) as Record<string, string>;
	} catch {
		return {};
	}
}

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ locale: string; namespace: string }> },
) {
	const { locale, namespace } = await params;
	const cleanNamespace = namespace.replace(/\.json$/, "");

	if (
		!NAMESPACES.includes(cleanNamespace as (typeof NAMESPACES)[number]) ||
		!LOCALES.includes(locale as (typeof LOCALES)[number])
	) {
		return NextResponse.json({}, { status: 404 });
	}

	const resolvedLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
	let messages = await loadMessages(resolvedLocale, cleanNamespace);
	if (Object.keys(messages).length === 0 && resolvedLocale !== DEFAULT_LOCALE) {
		messages = await loadMessages(DEFAULT_LOCALE, cleanNamespace);
	}

	const res = NextResponse.json(messages);
	// Translation files are immutable per deploy — cacheable at the edge.
	res.headers.set(
		"Cache-Control",
		"public, s-maxage=3600, stale-while-revalidate=86400",
	);
	return res;
}
