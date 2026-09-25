import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

const messageCache = new Map<string, Record<string, string>>();

async function loadNamespace(
	locale: string,
	namespace: string,
): Promise<Record<string, string>> {
	const cacheKey = `${locale}/${namespace}`;
	const cached = messageCache.get(cacheKey);
	if (cached) return cached;

	const filePath = path.join(
		process.cwd(),
		"messages",
		locale,
		`${namespace}.json`,
	);
	try {
		const raw = await readFile(filePath, "utf-8");
		const parsed = JSON.parse(raw) as Record<string, string>;
		messageCache.set(cacheKey, parsed);
		return parsed;
	} catch {
		return {};
	}
}

/**
 * Server-side translation lookup reading messages/{locale}/{ns}.json from disk.
 * Falls back to the default locale, then returns the key on a miss (per plan §7.2).
 */
function interpolate(
	template: string,
	vars?: Record<string, string | number>,
): string {
	if (!vars) return template;
	let out = template;
	for (const [name, value] of Object.entries(vars)) {
		out = out.replaceAll(`{{${name}}}`, String(value));
	}
	return out;
}

export async function getServerTranslation(
	locale: string,
	namespace: string,
	key: string,
	vars?: Record<string, string | number>,
): Promise<string> {
	const normalized: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;

	const primary = await loadNamespace(normalized, namespace);
	if (typeof primary[key] === "string" && primary[key].length > 0) {
		return interpolate(primary[key], vars);
	}

	if (normalized !== DEFAULT_LOCALE) {
		const fallback = await loadNamespace(DEFAULT_LOCALE, namespace);
		if (typeof fallback[key] === "string" && fallback[key].length > 0) {
			return interpolate(fallback[key], vars);
		}
	}

	return key;
}

/**
 * Resolve a user's preferred locale for notification dispatch.
 * Selects only `preferredLocale` and tolerates a missing column
 * (DBs that haven't run `prisma db push` yet) by falling back to "en".
 */
export async function resolveUserLocale(userId: string): Promise<Locale> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { preferredLocale: true },
		});
		const pref = (user as { preferredLocale?: unknown } | null)
			?.preferredLocale;
		if (isLocale(pref)) return pref;
	} catch (error: unknown) {
		console.error(
			"[ERROR] resolveUserLocale",
			error instanceof Error ? error.message : String(error),
		);
	}
	return DEFAULT_LOCALE;
}
