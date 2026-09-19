# Fix Locale Switcher and Onboarding / Auth / Dashboard / Cookie Preferences Translations

## Problem Analysis

The user reported:
1. **"the locale switch is not working. still seeing english for /onboarding etc."**
2. **"\"Cookie Preferences\" is always in English irrespective of the language selected."**

Our systematic investigation identified the following root causes:

1. **`components/consent/*` (Cookie Banner, Modal & Buttons) are 100% hardcoded in English**:
   - `CookieBanner.tsx`, `CookieCustomizeDialog.tsx`, `CookieManageButton.tsx`, and `CookieSettingsButton.tsx` have hardcoded English strings ("Cookie Preferences", "We use cookies to improve your experience...", "Customize", "Accept all", "Reject all", category labels/descriptions).
   - They had no localization hook or dictionary connection to `en`, `es`, `fr`, and `pt`.

2. **`components/onboarding/OnboardingFlow.tsx` has entire steps hardcoded in English**:
   - `AboutStep` (title, subtitle, sex "Male" / "Female", brother/sister in faith, age range, placeholder) was hardcoded in English.
   - `TimezoneStep` (title, subtitle, time zone label, placeholder) was hardcoded in English.
   - `CompleteStep` (title, subtitle, CTA button) was hardcoded in English.
   - All 42 corresponding keys are already fully translated in `messages/{en,es,fr,pt}/onboarding.json`, but `OnboardingFlow.tsx` was never connected to `t(...)` for these steps.

3. **No Locale Switcher on `/onboarding`**:
   - There is no language selector on `/onboarding` (neither in desktop nor mobile header), leaving users with no way to switch language on the onboarding page.

4. **No Locale Switcher on Auth Pages (`/login`, `/signup`, etc.)**:
   - `AuthBrand` in `components/auth/auth-shell.tsx` renders `tgaw.` with no `<LocaleSwitcher />`.

5. **`components/i18n/LocaleSwitcher.tsx` does not persist cookie or sync state**:
   - When switching language on public pages (e.g. landing page), `LocaleSwitcher` only executed `router.push('/es')`. It **did not** set the `NEXT_LOCALE` cookie, **did not** call `changeLanguage(newLocale)`, and **did not** call `PATCH /api/v1/locale`.
   - When the user navigated away from the landing page to `/login` or `/onboarding` (which rely on the cookie / `react-i18next`), the cookie was missing and `i18n` fell back to `navigator.language` (English).

6. **`components/i18n/DashboardLocaleSwitcher.tsx` does not call `router.refresh()`**:
   - Switching language in the dashboard updated `react-i18next` and the cookie, but did not refresh the page via Next.js router. Server Components (overview, bible, prayer, worship, root layout `<html lang>`) did not re-render with the new cookie until a manual reload.

7. **Locale normalization in `i18n/config.ts`**:
   - Browser languages like `"es-ES"` or `"fr-FR"` failed `isLocale` strict check against `["en", "fr", "es", "pt"]`, falling back to `"en"`. Adding `normalizeLocale` ensures regional tags map to the base language.

8. **`app/(onboarding)/layout.tsx` & `app/(dashboard)/layout.tsx` missing initial locale propagation**:
   - Passing `initialLocale` from server layout (which reads `NEXT_LOCALE` cookie and DB `preferredLocale`) into `I18nProvider` guarantees `i18n.language` is immediately accurate without hydration race conditions.

9. **`proxy.ts` prefix routing for protected/onboarding paths**:
   - If a user with a locale prefix visits `/{locale}/onboarding` or `/{locale}/overview`, `proxy.ts` should redirect to the bare path while setting the `NEXT_LOCALE` cookie, rather than letting it fall through or 404.

---

## Proposed Changes

### 1. i18n Configuration & Helpers

#### [MODIFY] [config.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/i18n/config.ts)
- Add `normalizeLocale(value: unknown): Locale` helper to handle language tags (e.g. `"es-ES"` -> `"es"`, `"fr-FR"` -> `"fr"`).

---

### 2. Cookie Consent Internationalization

#### [NEW] [translations.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/consent/translations.ts)
- Provide typed localized dictionaries for `en`, `fr`, `es`, and `pt` covering:
  - Banner header, description variants (strict, us_opt_out, notice, gpc), policy links, buttons (Customize, Accept all, Reject non-essential / Reject all).
  - Modal title, description variants, GPC disclaimer, 4 category names and descriptions, Do Not Sell link, Cancel, Save.
  - Buttons ("Manage cookie preferences", "Manage Cookies").
- Export `useConsentTranslation()` hook that reacts dynamically to language changes (`i18n`, `document.documentElement.lang`, and cookie).

#### [MODIFY] [CookieBanner.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/consent/CookieBanner.tsx)
- Use `useConsentTranslation()` to render all texts in the active locale.

#### [MODIFY] [CookieCustomizeDialog.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/consent/CookieCustomizeDialog.tsx)
- Use `useConsentTranslation()` to render all dialog titles, descriptions, categories, and buttons in the active locale.

#### [MODIFY] [CookieManageButton.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/consent/CookieManageButton.tsx)
- Use `useConsentTranslation()` for the button label.

#### [MODIFY] [CookieSettingsButton.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/consent/CookieSettingsButton.tsx)
- Use `useConsentTranslation()` for the button label.

---

### 3. Locale Switcher Components

#### [MODIFY] [LocaleSwitcher.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/i18n/LocaleSwitcher.tsx)
- In `switchLocale`:
  - Set `document.cookie = NEXT_LOCALE=...; path=/; max-age=...; samesite=lax`.
  - Call `changeLanguage(newLocale)` on `i18n` (fire-and-forget).
  - Call `fetch("/api/v1/locale", { method: "PATCH", ... })` (fire-and-forget).
  - Update route via `router.push(newPath)` and `router.refresh()`.

#### [MODIFY] [DashboardLocaleSwitcher.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/i18n/DashboardLocaleSwitcher.tsx)
- Use `normalizeLocale(i18n.language)` to resolve `current` locale.
- Call `router.refresh()` after language change so Server Components re-render with the new cookie.

---

### 4. Onboarding Flow & Layout

#### [MODIFY] [OnboardingFlow.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/onboarding/OnboardingFlow.tsx)
- Replace all hardcoded English strings in `AboutStep`, `TimezoneStep`, and `CompleteStep` with their corresponding `t("...")` keys:
  - `about.title`, `about.subtitle`, `about.sex`, `about.male`, `about.maleSubtitle`, `about.female`, `about.femaleSubtitle`, `about.ageRange`, `about.ageRangePlaceholder`.
  - `timezone.title`, `timezone.subtitle`, `timezone.label`, `timezone.placeholder`.
  - `complete.title`, `complete.subtitle`, `complete.cta`.
- Add `<DashboardLocaleSwitcher />` to desktop header and `<DashboardLocaleSwitcher compact />` to mobile brand bar so the user can easily switch language during onboarding.

#### [MODIFY] [I18nProvider.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/providers/I18nProvider.tsx)
- Accept optional `initialLocale?: Locale` prop and synchronize `i18n.language` on mount.

#### [MODIFY] [app/(onboarding)/layout.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(onboarding)/layout.tsx)
- Read `NEXT_LOCALE` cookie and session `preferredLocale` on the server and pass `initialLocale` to `<I18nProvider>`.

#### [MODIFY] [app/(dashboard)/layout.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(dashboard)/layout.tsx)
- Read `NEXT_LOCALE` cookie and session `preferredLocale` on the server and pass `initialLocale` to `<I18nProvider>`.

---

### 5. Auth Pages & Public Shell

#### [MODIFY] [auth-shell.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/auth/auth-shell.tsx)
- Add `<LocaleSwitcher />` to `AuthBrand` so `/login`, `/signup`, `/forgot-password`, `/reset-password` all have language switching capability.

---

### 6. Routing & Proxy

#### [MODIFY] [proxy.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/proxy.ts)
- Use `barePath.startsWith(p)` for `isProtected` checks.
- If a request comes in for `/{locale}/onboarding` or `/{locale}/{protectedPath}`, redirect to the bare path while setting the `NEXT_LOCALE` cookie.

---

## Verification Plan

### Automated Verification
1. Run `node scripts/check-translations.mjs` to ensure all translation keys match across `en`, `es`, `fr`, and `pt`.
2. Run `bun run typecheck` to verify TypeScript compile check passes without errors.

### Manual Verification
1. Verify Cookie Preferences banner and modal:
   - When English is active: "Cookie Preferences", "Strictly Necessary", "Customize", "Accept all".
   - When Spanish is active: "Preferencias de cookies", "Estrictamente necesarias", "Personalizar", "Aceptar todo".
   - When French is active: "Préférences de cookies", "Strictement nécessaires", "Personnaliser", "Tout accepter".
   - When Portuguese is active: "Preferências de cookies", "Estritamente necessários", "Personalizar", "Aceitar todos".
2. Test switching locale on the landing page to Spanish/French/Portuguese, verify that navigating to `/login` or `/signup` preserves the locale.
3. Test `/onboarding` in Spanish/French/Portuguese:
   - Verify Step 1 (Name), Step 2 (Contact), Step 3 (About), Step 4 (Timezone), and Step 5 (Complete) render in the chosen language.
   - Verify the in-page `<DashboardLocaleSwitcher />` works and immediately switches the UI language on `/onboarding`.
4. Test switching locale in the dashboard sidebar:
   - Verify Server Components (overview, devotion pages) and client components immediately reflect the chosen language.
