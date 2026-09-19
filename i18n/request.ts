import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** Namespaces served to public (next-intl) pages. */
const PUBLIC_NAMESPACES = ["common", "landing", "auth", "legal", "errors"];

/**
 * Recursively unflatten dot-separated keys so next-intl's dot-path traversal
 * can resolve keys like `notFound.dashboard` or `hero.badge` while preserving
 * original flat keys for any direct lookups.
 */
function unflatten(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

async function loadNamespace(
  locale: string,
  ns: string
): Promise<Record<string, unknown>> {
  try {
    const raw = (await import(`../messages/${locale}/${ns}.json`)).default;
    return unflatten(raw);
  } catch {
    // Missing file (e.g. untranslated stub) — fall back to empty and let
    // the default-locale fallback / key rendering take over.
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const messages: Record<string, Record<string, unknown>> = {};
  for (const ns of PUBLIC_NAMESPACES) {
    messages[ns] = await loadNamespace(locale, ns);
  }

  return { locale, messages };
});
