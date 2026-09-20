import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { LandingContent } from "@/components/landing/landing-content";
import { VerseCard } from "@/components/verse/VerseCard";

export const dynamic = "force-dynamic";

function localizedPath(locale: string, path = ""): string {
  const suffix = path ? `/${path.replace(/^\//, "")}` : "";
  return locale === DEFAULT_LOCALE ? suffix || "/" : `/${locale}${suffix}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = "The Global Altar Watch — Daily Devotion, Prayer & Fellowship";
  let description =
    "A modern Christian community platform for daily devotion, prayer, Bible reading, and fellowship with believers worldwide.";
  try {
    const t = await getTranslations({ locale, namespace: "landing" });
    title = t("meta.title");
    description = t("meta.description");
  } catch {
    // English fallback — build never breaks on missing keys
  }
  if (!title || title === "meta.title") {
    title = "The Global Altar Watch — Daily Devotion, Prayer & Fellowship";
  }
  if (!description || description === "meta.description") {
    description =
      "A modern Christian community platform for daily devotion, prayer, Bible reading, and fellowship with believers worldwide.";
  }
  return {
    title,
    description,
    alternates: {
      canonical: localizedPath(locale),
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, localizedPath(loc)]),
      ),
    },
  };
}

export default function LandingPage() {
  return <LandingContent verseSlot={<VerseCard />} />;
}