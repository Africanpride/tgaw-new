import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/i18n/config";
import type { UpdateTranslationConfigInput } from "@/lib/schemas/translationConfigSchema";

const DEFAULT_CONFIG = { enableFr: false, enableEs: false, enablePt: false } as const;

export async function getTranslationConfig() {
  const row = await prisma.translationConfig.findFirst();
  return row ?? { id: "", ...DEFAULT_CONFIG, updatedBy: "", updatedAt: new Date(), createdAt: new Date() };
}

export async function getEnabledLocales(): Promise<Locale[]> {
  const cfg = await getTranslationConfig();
  const locales: Locale[] = ["en"];
  if (cfg.enableFr) locales.push("fr");
  if (cfg.enableEs) locales.push("es");
  if (cfg.enablePt) locales.push("pt");
  return locales;
}

export async function updateTranslationConfig(data: UpdateTranslationConfigInput, updatedBy: string) {
  const existing = await prisma.translationConfig.findFirst();

  if (existing) {
    return prisma.translationConfig.update({
      where: { id: existing.id },
      data: { ...data, updatedBy },
    });
  }

  return prisma.translationConfig.create({
    data: { ...DEFAULT_CONFIG, ...data, updatedBy },
  });
}
