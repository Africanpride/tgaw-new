"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useEnabledLocales } from "@/hooks/use-enabled-locales";
import { Languages } from "lucide-react";
import { IconTile } from "@/components/IconTile";

interface TranslationConfig {
  enableFr: boolean;
  enableEs: boolean;
  enablePt: boolean;
}

const TOGGLEABLE_LOCALES: Locale[] = ["fr", "es", "pt"];

export function AdminTranslationConfig() {
  const { t } = useTranslation("admin");
  const { mutate: refetchLocales } = useEnabledLocales();
  const [config, setConfig] = useState<TranslationConfig>({ enableFr: false, enableEs: false, enablePt: false });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Locale | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/config/translations");
      if (!res.ok) {
        toast.error(t("translations.loadFailed"));
        return;
      }
      const json = await res.json();
      if (json.success) setConfig(json.data.config);
    } catch {
      toast.error(t("translations.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleToggle = async (locale: Locale, checked: boolean) => {
    setSaving(locale);
    const field = `enable${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof TranslationConfig;
    const optimistic = { ...config, [field]: checked };
    setConfig(optimistic);

    try {
      const res = await fetch("/api/v1/config/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: checked }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data.config);
        refetchLocales();
        toast.success(t("translations.saved"));
      } else {
        setConfig(config);
        toast.error(t("translations.saveFailed"));
      }
    } catch {
      setConfig(config);
      toast.error(t("translations.saveFailed"));
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <IconTile icon={Languages} size="md" iconClassName="size-4" />
          {t("translations.title")}
        </CardTitle>
        <CardDescription>{t("translations.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {TOGGLEABLE_LOCALES.map((locale) => {
          const field = `enable${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof TranslationConfig;
          return (
            <div key={locale} className="flex items-center gap-3">
              <Checkbox
                id={`lang-${locale}`}
                checked={config[field]}
                disabled={saving !== null}
                onCheckedChange={(checked) => handleToggle(locale, !!checked)}
              />
              <Label htmlFor={`lang-${locale}`} className="cursor-pointer">
                {LOCALE_NAMES[locale]} ({locale.toUpperCase()})
                {saving === locale && <span className="ml-2 text-xs text-muted-foreground">...</span>}
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
