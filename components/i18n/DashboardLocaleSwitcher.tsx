"use client";

import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n/client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_NAME,
  LOCALE_NAMES,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

interface DashboardLocaleSwitcherProps {
  /** Icon-only trigger for tight placements (e.g. sidebar footer). */
  compact?: boolean;
  className?: string;
}

/**
 * Dashboard locale switcher (react-i18next, cookie-based, no URL prefix).
 * Persists via PATCH /api/v1/locale (DB + cookie) and sets the
 * NEXT_LOCALE cookie client-side for immediate effect.
 */
export function DashboardLocaleSwitcher({
  compact = false,
  className,
}: DashboardLocaleSwitcherProps) {
  const { i18n } = useTranslation("common");
  const current: Locale = isLocale(i18n.language)
    ? i18n.language
    : DEFAULT_LOCALE;

  function switchLocale(newLocale: Locale) {
    if (newLocale === current) return;
    void changeLanguage(newLocale).catch(() => {});
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; samesite=lax`;
    void fetch("/api/v1/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {});
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        {...(compact ? { "aria-label": "Change language" } : {})}
        className={cn(
          buttonVariants({ variant: "ghost", size: compact ? "icon" : "sm" }),
          "cursor-pointer gap-2",
          !compact && "w-full justify-start px-2",
          className,
        )}
      >
        <Globe className="size-4" aria-hidden="true" />
        {!compact && <span className="flex-1 text-left">{LOCALE_NAMES[current]}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={compact ? "top" : "bottom"}>
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className="cursor-pointer gap-2"
            onClick={() => switchLocale(loc)}
          >
            <span className="flex-1">{LOCALE_NAMES[loc]}</span>
            {loc === current && (
              <Check className="size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
