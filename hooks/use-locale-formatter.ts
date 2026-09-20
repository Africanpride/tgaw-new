"use client";

import { useTranslation } from "react-i18next";
import {
	formatDate,
	formatTime,
	formatNumber,
	formatRelativeTime,
} from "@/lib/formatters";
import type { Locale } from "@/i18n/config";

export function useLocaleFormatter() {
	const { i18n } = useTranslation();
	const locale = (i18n.language || "en") as Locale;

	return {
		locale,
		formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
			formatDate(date, locale, options),
		formatTime: (date: Date | string) => formatTime(date, locale),
		formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
			formatNumber(value, locale, options),
		formatRelativeTime: (date: Date) => formatRelativeTime(date, locale),
	};
}
