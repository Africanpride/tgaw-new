"use client";

import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
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
  normalizeLocale,
  type Locale,
} from "@/i18n/config";
import { changeLanguage } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Public-page locale switcher (next-intl URL-prefix routing).
 * Default locale uses unprefixed paths (localePrefix "as-needed").
 * Also persists NEXT_LOCALE cookie and syncs with react-i18next / DB.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const rawLocale = useLocale();
  const locale: Locale = normalizeLocale(rawLocale);
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    if (newLocale === locale) return;

    // Set cookie immediately so client and server share the new locale
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; samesite=lax`;

    // Sync react-i18next in memory (used by dashboard, onboarding, consent)
    void changeLanguage(newLocale).catch(() => {});

    // Sync DB if user is signed in
    void fetch("/api/v1/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {});

    // Compute new URL prefix
    const prefix = `/${locale}`;
    let newPath: string;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length) || "/";
      newPath =
        newLocale === DEFAULT_LOCALE
          ? rest
          : `/${newLocale}${rest === "/" ? "" : rest}`;
    } else if (newLocale === DEFAULT_LOCALE) {
      newPath = pathname;
    } else {
      newPath = `/${newLocale}${pathname === "/" ? "" : pathname}`;
    }

    router.push(newPath);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change language"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "cursor-pointer",
          className,
        )}
      >
        <Globe className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className="cursor-pointer gap-2"
            onClick={() => switchLocale(loc)}
          >
            <span className="flex-1">{LOCALE_NAMES[loc]}</span>
            {loc === locale && (
              <Check className="size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
