import { enUS, es, fr, pt } from "date-fns/locale";
import type { Locale } from "date-fns";

const DATE_LOCALES: Record<string, Locale> = { en: enUS, es, fr, pt };

/**
 * date-fns locale for an i18n language tag (e.g. "fr", "pt-BR").
 * Falls back to English for unknown languages.
 */
export function dateLocale(language: string | undefined): Locale {
  return DATE_LOCALES[(language ?? "en").split("-")[0].toLowerCase()] ?? enUS;
}
