export const LOCALES = ["en", "fr", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

/** ISO 3166-1 alpha-2 → flag country code for react-circle-flags */
export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "gb",
  fr: "fr",
  es: "es",
  pt: "br",
};

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (LOCALES as readonly string[]).includes(value)
  );
}

export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const base = value.split("-")[0].toLowerCase();
  return isLocale(base) ? base : DEFAULT_LOCALE;
}
