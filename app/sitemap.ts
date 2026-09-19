import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/terms", "/privacy", "/cookies"];

function baseUrl(): string {
	return (
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
		"http://localhost:3000"
	);
}

function localizedPath(locale: string, path: string): string {
	if (path === "/") {
		return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
	}
	return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
	const base = baseUrl();
	const now = new Date();

	return PUBLIC_PATHS.flatMap((path) =>
		LOCALES.map((locale) => ({
			url: `${base}${localizedPath(locale, path)}`,
			lastModified: now,
			alternates: {
				languages: Object.fromEntries(
					LOCALES.map((loc) => [loc, `${base}${localizedPath(loc, path)}`]),
				),
			},
		})),
	);
}
