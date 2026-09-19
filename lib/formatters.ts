import type { Locale } from "@/i18n/config";

const LOCALE_MAP: Record<string, string> = {
	en: "en-US",
	fr: "fr-FR",
	es: "es-ES",
	pt: "pt-BR",
};

function toBcp47(locale: Locale): string {
	return LOCALE_MAP[locale] ?? LOCALE_MAP.en;
}

export function formatDate(
	date: Date | string,
	locale: Locale,
	options?: Intl.DateTimeFormatOptions,
) {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat(toBcp47(locale), {
		day: "numeric",
		month: "long",
		year: "numeric",
		...options,
	}).format(d);
}

export function formatTime(date: Date | string, locale: Locale) {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat(toBcp47(locale), {
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
}

export function formatNumber(
	value: number,
	locale: Locale,
	options?: Intl.NumberFormatOptions,
) {
	return new Intl.NumberFormat(toBcp47(locale), options).format(value);
}

export function formatRelativeTime(date: Date, locale: Locale): string {
	const rtf = new Intl.RelativeTimeFormat(toBcp47(locale), {
		numeric: "auto",
	});
	const diffMs = date.getTime() - Date.now();
	const diffSec = Math.round(diffMs / 1000);
	const diffMin = Math.round(diffSec / 60);
	const diffHr = Math.round(diffMin / 60);
	const diffDay = Math.round(diffHr / 24);

	if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
	if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
	if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
	return rtf.format(diffDay, "day");
}
