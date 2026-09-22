# Language Dialog in Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the dashboard language change UI from the sidebar footer (dropdown) to a shadcn Dialog triggered by a Globe icon button in the Topbar, immediately before the theme toggle.

**Architecture:** New self-contained `components/i18n/LanguageDialog.tsx` (trigger + dialog). Topbar renders it between theme toggle and the notifications bell. Sidebar footer switcher removed; `DashboardLocaleSwitcher.tsx` deleted.

**Tech Stack:** React 19, Next.js 16, react-i18next, shadcn/ui Dialog, react-circle-flags, Lucide React.

## Global Constraints
- shadcn semantic tokens only; no ad-hoc hex colors.
- All `<svg>`/Lucide icons get `aria-hidden="true"` or a `<title>`.
- Trigger buttons: `variant="ghost" size="icon" className="cursor-pointer"`.
- Switch logic preserved verbatim from `DashboardLocaleSwitcher`: optimistic `changeLanguage()` + `NEXT_LOCALE` cookie write + fire-and-forget `PATCH /api/v1/locale`.
- Verification per spec: `bun run typecheck` + `bun run build`.

---

### Task 1: Add i18n keys

**Files:**
- Modify: `messages/en/dashboard.json`, `messages/fr/dashboard.json`, `messages/es/dashboard.json`, `messages/pt/dashboard.json`

Insert after `"topbar.toggleTheme"` line in each file:

- **en**:
```json
  "topbar.changeLanguage": "Change language",
  "topbar.languageDescription": "Choose the language used across the dashboard. Your choice is saved to your account and this device.",
```
- **fr**:
```json
  "topbar.changeLanguage": "Changer de langue",
  "topbar.languageDescription": "Choisissez la langue utilisée dans le tableau de bord. Votre choix est enregistré sur votre compte et cet appareil.",
```
- **es**:
```json
  "topbar.changeLanguage": "Cambiar idioma",
  "topbar.languageDescription": "Elige el idioma del panel. Tu elección se guarda en tu cuenta y en este dispositivo.",
```
- **pt**:
```json
  "topbar.changeLanguage": "Mudar idioma",
  "topbar.languageDescription": "Escolha o idioma usado no painel. Sua escolha é salva na sua conta e neste dispositivo.",
```

- [ ] **Step 1:** Apply the four edits above.

---

### Task 2: Create `LanguageDialog` component

**Files:**
- Create: `components/i18n/LanguageDialog.tsx`

**Interfaces:**
- Consumes: `i18n/client` `changeLanguage`, `i18n/config` (`LOCALES`, `LOCALE_NAMES`, `LOCALE_FLAGS`, `LOCALE_COOKIE_NAME`, `DEFAULT_LOCALE`, `isLocale`, `Locale`), `dashboard` namespace keys `topbar.changeLanguage`, `topbar.languageDescription`.
- Produces: `LanguageDialog()` — no props.

- [ ] **Step 1:** Create `components/i18n/LanguageDialog.tsx`:

```tsx
"use client";

import { Check, Globe } from "lucide-react";
import { useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_NAME,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Dashboard language dialog — Globe trigger in the Topbar opens this dialog.
 * Persists via PATCH /api/v1/locale (DB + cookie) and sets the
 * NEXT_LOCALE cookie client-side for immediate effect.
 */
export function LanguageDialog() {
  const { t, i18n } = useTranslation("dashboard");
  const [open, setOpen] = useState(false);
  const current: Locale = isLocale(i18n.language)
    ? i18n.language
    : DEFAULT_LOCALE;

  function switchLocale(newLocale: Locale) {
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          aria-label={t("topbar.changeLanguage")}
        >
          <Globe className="size-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("topbar.changeLanguage")}</DialogTitle>
          <DialogDescription>
            {t("topbar.languageDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {LOCALES.map((loc) => {
            const isActive = loc === current;
            return (
              <Button
                key={loc}
                variant="ghost"
                className={cn(
                  "h-auto w-full cursor-pointer justify-start gap-3 px-3 py-2.5",
                  isActive && "bg-muted",
                )}
                aria-current={isActive ? "true" : undefined}
                onClick={() => switchLocale(loc)}
              >
                <CircleFlag
                  countryCode={LOCALE_FLAGS[loc]}
                  height={20}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left text-sm font-medium">
                  {LOCALE_NAMES[loc]}
                </span>
                {isActive && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 3: Wire Topbar, remove sidebar switcher, delete old component

**Files:**
- Modify: `components/dashboard/Topbar.tsx`
- Modify: `components/app-sidebar.tsx`
- Delete: `components/i18n/DashboardLocaleSwitcher.tsx`

- [ ] **Step 1:** In `components/dashboard/Topbar.tsx`:
  - Add import: `import { LanguageDialog } from "@/components/i18n/LanguageDialog";`
  - Inside `<div className="ml-auto flex shrink-0 items-center gap-2">`, insert `<LanguageDialog />` immediately BEFORE the theme toggle `<Button ... onClick={cycleTheme}>`.

- [ ] **Step 2:** In `components/app-sidebar.tsx`:
  - Remove the import: `import { DashboardLocaleSwitcher } from "@/components/i18n/DashboardLocaleSwitcher"`
  - Remove the footer block:
```tsx
        <div className="flex justify-center px-2 pt-1 group-data-[collapsible=icon]:px-0">
          <DashboardLocaleSwitcher compact />
        </div>
```

- [ ] **Step 3:** Delete `components/i18n/DashboardLocaleSwitcher.tsx`.

---

### Task 4: Verify

- [ ] **Step 1:** Run `bun run typecheck` — Expected: exit 0, no errors.
- [ ] **Step 2:** Run `bun run build` — Expected: successful compilation.
- [ ] **Step 3:** Run `bun test` — Expected: all existing tests pass.
