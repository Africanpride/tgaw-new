# TGAW Internationalization (i18n) Plan

> **Goal**: Translate the TGAW web app into **English (en)**, **French (fr)**, **Spanish (es)**, and **Portuguese (pt)** — the four most widely spoken languages across the Christian world in Africa and Latin America.

---

## Design Decisions (Resolved)

| Decision | Choice |
|---|---|
| **Target languages** | `en` (default), `fr`, `es`, `pt` |
| **i18n strategy** | **Hybrid**: `next-intl` for public SEO pages + `react-i18next` for the authenticated dashboard |
| **Locale routing** | URL prefix (`/fr/`, `/es/`, `/pt/`) for public pages; cookie-based switching for dashboard |
| **Language detection** | Auto-detect from `Accept-Language` header on first visit; visible language switcher to override |
| **Translation files** | Flat JSON files per namespace per locale (`/messages/{locale}/{namespace}.json`) |
| **Translation scope** | UI-only — navigation, buttons, labels, headings, placeholders, errors, toasts, static copy. User-generated content stays in original language. |
| **Translation source** | Infrastructure + English baseline built first; French/Spanish/Portuguese translations provided later manually or via translation service |
| **Language switcher** | Dropdown in navbar (desktop) + mobile sheet menu + `/settings` page for logged-in users |
| **Locale persistence** | `preferredLocale` field on `User` model (DB) + `NEXT_LOCALE` cookie |
| **Date/number formatting** | Yes — `Intl.DateTimeFormat` / `Intl.NumberFormat` locale-aware formatting |
| **RTL support** | LTR only for now; all 4 languages are LTR. RTL deferred to future Arabic addition. |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      PUBLIC PAGES                              │
│  Landing • Login • Signup • Terms • Privacy • Cookies          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  next-intl                                               │  │
│  │  • URL prefix routing: /en/, /fr/, /es/, /pt/           │  │
│  │  • SEO: hreflang, localized <title>, meta descriptions  │  │
│  │  • Server Components: getTranslations()                 │  │
│  │  • Client Components: useTranslations()                 │  │
│  │  • Locale detection via Accept-Language in proxy.ts      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                     DASHBOARD (AUTHENTICATED)                  │
│  Overview • Bible • Prayer • Calendar • Messages • Worship     │
│  Groups • Settings • Admin • Coordinator • Board • Feed        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  react-i18next                                           │  │
│  │  • Cookie-based locale (no URL prefix)                  │  │
│  │  • I18nextProvider wrapping (dashboard)/layout.tsx       │  │
│  │  • useTranslation() hook in client components           │  │
│  │  • Lazy namespace loading per page                      │  │
│  │  • Locale synced from User.preferredLocale on login     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Infrastructure Setup

### 1.1 Install Dependencies

```bash
npm install next-intl i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

| Package | Purpose |
|---|---|
| `next-intl` | Server & client i18n for public SEO pages with App Router |
| `i18next` | Core i18n framework for dashboard |
| `react-i18next` | React bindings — `useTranslation()`, `<Trans>`, `I18nextProvider` |
| `i18next-browser-languagedetector` | Auto-detect locale from cookie / `navigator.language` |
| `i18next-http-backend` | Lazy-load namespace JSON files on demand in the browser |

---

### 1.2 Directory Structure

```
messages/                            ← Translation files (next-intl + shared)
├── en/
│   ├── common.json                  ← Shared: nav, buttons, roles, errors
│   ├── landing.json                 ← Landing page hero, features, stats, testimonials
│   ├── auth.json                    ← Login, signup, forgot/reset password, verification
│   ├── onboarding.json              ← Onboarding wizard steps
│   ├── dashboard.json               ← Sidebar, topbar, overview page
│   ├── bible.json                   ← Bible reading page
│   ├── prayer.json                  ← Prayer page
│   ├── worship.json                 ← Worship page
│   ├── calendar.json                ← Calendar & scheduler
│   ├── messages.json                ← Messaging / chat
│   ├── groups.json                  ← Groups management
│   ├── feed.json                    ← Social feed, posts, comments
│   ├── booking.json                 ← Slot booking UI
│   ├── settings.json                ← Account settings page
│   ├── admin.json                   ← Admin portal, user mgmt, reports
│   ├── notifications.json           ← Notification labels & toasts
│   ├── legal.json                   ← Terms, privacy, cookies pages
│   └── errors.json                  ← Error page, 404, 403, validation msgs
├── fr/
│   └── (same structure — initially empty stubs)
├── es/
│   └── (same structure — initially empty stubs)
└── pt/
    └── (same structure — initially empty stubs)

i18n/                                ← Configuration
├── routing.ts                       ← next-intl routing config (locales, defaultLocale)
├── request.ts                       ← next-intl server-side message loader
├── config.ts                        ← Shared constants (LOCALES, DEFAULT_LOCALE, LOCALE_NAMES)
└── client.ts                        ← react-i18next client init for dashboard
```

---

### 1.3 Shared Config — `i18n/config.ts`

```typescript
export const LOCALES = ["en", "fr", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

/** ISO 639-1 → flag country code for react-circle-flags */
export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "gb",
  fr: "fr",
  es: "es",
  pt: "br",
};
```

---

### 1.4 next-intl Setup (Public Pages)

#### [NEW] `i18n/routing.ts`

```typescript
import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./config";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",    // no /en/ prefix for default locale
});
```

#### [NEW] `i18n/request.ts`

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { hasLocale } from "next-intl";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  // Load all public-facing namespaces
  const namespaces = ["common", "landing", "auth", "legal", "errors"];
  const messages: Record<string, Record<string, string>> = {};
  for (const ns of namespaces) {
    messages[ns] = (await import(`../messages/${locale}/${ns}.json`)).default;
  }

  return { locale, messages };
});
```

#### [MODIFY] `next.config.ts`

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      process.env.VAPID_PUBLIC_KEY ||
      "",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  serverExternalPackages: ["mongodb"],
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);
```

---

### 1.5 react-i18next Setup (Dashboard)

#### [NEW] `i18n/client.ts`

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { LOCALES, DEFAULT_LOCALE } from "./config";

// Dashboard namespaces — loaded lazily per page
const DASHBOARD_NAMESPACES = [
  "common",
  "dashboard",
  "bible",
  "prayer",
  "worship",
  "calendar",
  "messages",
  "groups",
  "feed",
  "booking",
  "settings",
  "admin",
  "notifications",
  "errors",
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: LOCALES as unknown as string[],
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: DASHBOARD_NAMESPACES,

    // Load translations from /messages/{lng}/{ns}.json
    backend: {
      loadPath: "/messages/{{lng}}/{{ns}}.json",
    },

    detection: {
      order: ["cookie", "navigator"],
      caches: ["cookie"],
      lookupCookie: "NEXT_LOCALE",
      cookieOptions: { path: "/", sameSite: "lax" },
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

#### [NEW] `providers/I18nProvider.tsx`

```tsx
"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/client";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

#### [MODIFY] `app/(dashboard)/layout.tsx`

Wrap children with `I18nProvider`:

```diff
+import { I18nProvider } from "@/providers/I18nProvider";

 export default async function DashboardLayout({ children }) {
   // ... existing auth check ...
   return (
     <SidebarProvider defaultOpen={false}>
+      <I18nProvider>
         {/* ... existing sidebar, topbar, etc. ... */}
+      </I18nProvider>
     </SidebarProvider>
   );
 }
```

---

### 1.6 Locale Routing in `proxy.ts`

> **Constraint**: `middleware.ts` is deprecated in this project. All routing lives in `proxy.ts`.

#### Integration Strategy

`next-intl` provides `createMiddleware(routing)` which we need to compose with the existing `proxy()` function. The approach:

1. For **public pages** (not in `PROTECTED_PATHS`, not `/api/`): delegate to `next-intl`'s middleware for locale detection, cookie setting, and URL rewriting.
2. For **dashboard pages** (`PROTECTED_PATHS`): skip `next-intl` routing (no URL prefix), just pass through existing auth/RBAC logic. The dashboard reads locale from the `NEXT_LOCALE` cookie via `react-i18next`.
3. For **API routes** (`/api/`): no locale handling, pass through as-is.

```typescript
// At top of proxy.ts
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  // Public pages → delegate to next-intl for locale routing
  if (!isApi && !isProtected && !AUTH_PAGES.some(p => path.startsWith(p))) {
    const response = intlMiddleware(req);
    return withConsentHeaders(response, req);
  }

  // ... rest of existing proxy logic unchanged ...
}
```

---

### 1.7 Database — User Locale Preference

#### [MODIFY] `prisma/schema.prisma`

Add `preferredLocale` to the `User` model:

```diff
 model User {
   id            String    @id @map("_id")
   email         String    @unique
   // ... existing fields ...
+  preferredLocale String? @default("en")  // ISO 639-1: en, fr, es, pt
   // ...
 }
```

#### [NEW] API endpoint `app/api/v1/locale/route.ts`

```typescript
// PATCH — Update user's preferred locale
// Body: { locale: "fr" }
// Sets both the DB field and the NEXT_LOCALE cookie
```

---

### 1.8 Public Page Restructure

The public pages need to be nested under `app/[locale]/` for `next-intl` URL prefix routing:

```
app/
├── [locale]/                      ← NEW: next-intl locale segment
│   ├── layout.tsx                 ← Locale-aware root layout (html lang={locale})
│   ├── page.tsx                   ← Landing page (currently app/page.tsx)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── cookies/page.tsx
│   ├── not-found.tsx
│   └── error.tsx
├── (dashboard)/                   ← UNCHANGED: no [locale] prefix
│   └── ... all dashboard routes stay as-is
├── api/                           ← UNCHANGED
└── globals.css
```

> **IMPORTANT**: The `(dashboard)` route group does **NOT** get a `[locale]` segment. Dashboard pages read locale from the cookie, not the URL.

#### [NEW] `app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* ThemeProvider, ConsentProvider, etc. */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> **WARNING**: The existing `app/layout.tsx` becomes a **pass-through** root layout (no `<html>`, no `<body>`) since those tags move into `app/[locale]/layout.tsx`. The root layout keeps only providers that don't need locale context (e.g., fonts CSS variables via `className` on a wrapper `<div>`). This is the biggest structural change in the entire plan.

---

## Phase 2 — Translation Namespace Schema

### 2.1 Namespace Definitions

Each namespace maps to a page or feature. Keys use **dot-separated flat structure** for simplicity:

#### `common.json` — Shared across all pages

```json
{
  "app.name": "The Global Altar Watch",
  "app.tagline": "Your Daily Faith Companion",
  "nav.features": "Features",
  "nav.community": "Community",
  "nav.testimonials": "Testimonials",
  "nav.dashboard": "Dashboard",
  "nav.signIn": "Sign In",
  "nav.signOut": "Sign Out",
  "nav.getStarted": "Get Started",
  "nav.getStartedFree": "Get Started Free",
  "nav.goToDashboard": "Go to Dashboard",
  "nav.menu": "Menu",
  "nav.skipToContent": "Skip to content",
  "role.member": "Member",
  "role.coordinator": "Coordinator",
  "role.board": "Board",
  "role.leader": "Leader",
  "role.superadmin": "Super Admin",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.delete": "Delete",
  "action.edit": "Edit",
  "action.submit": "Submit",
  "action.confirm": "Confirm",
  "action.close": "Close",
  "action.back": "Back",
  "action.next": "Next",
  "action.previous": "Previous",
  "action.search": "Search",
  "action.filter": "Filter",
  "action.refresh": "Refresh",
  "action.loading": "Loading...",
  "action.retry": "Retry",
  "state.empty": "Nothing here yet",
  "state.noResults": "No results found",
  "time.today": "Today",
  "time.yesterday": "Yesterday",
  "time.tomorrow": "Tomorrow",
  "time.justNow": "Just now",
  "time.minutesAgo": "{{count}} min ago",
  "time.hoursAgo": "{{count}}h ago",
  "time.daysAgo": "{{count}}d ago"
}
```

#### `landing.json` — Landing page

```json
{
  "hero.badge": "Your Daily Faith Companion",
  "hero.title": "The Global <gradient>Altar</gradient> Watch",
  "hero.subtitle": "A modern Christian community platform for daily devotion, prayer, Bible reading, and fellowship with believers worldwide.",
  "stats.activeMembers": "Active Believers",
  "stats.prayerSessions": "Prayer Sessions",
  "stats.booksCovered": "Books Covered",
  "stats.satisfaction": "Member Satisfaction",
  "features.badge": "Everything for the Watch",
  "features.title": "One faithful habit, every day",
  "features.subtitle": "Everything you need to keep a consistent devotional life, together with believers around the world.",
  "features.devotion.title": "Daily Devotion",
  "features.devotion.description": "Slot-based Bible reading, prayer, and worship you can actually commit to — with live Zoom links and reminders.",
  "features.fellowship.title": "Real-Time Fellowship",
  "features.fellowship.description": "Group prayer circles, Bible study chats, and instant messages with believers worldwide.",
  "features.verse.title": "Verse of the Day",
  "features.verse.description": "A fresh scripture every morning, shareable in one tap — start your day anchored in the Word.",
  "features.community.title": "Community Stories",
  "features.community.description": "Testimonies, praise reports, and prayer requests that keep the whole altar watch together.",
  "features.calendar.title": "Calendar of Watch",
  "features.calendar.description": "Your devotional schedule on one shared calendar — sync it to Google, Apple, or Outlook.",
  "features.guided.title": "Guided Structure",
  "features.guided.description": "Bible reading plans and progress streaks keep your habit alive day after day.",
  "community.badge": "Grow Together",
  "community.title": "Never watch alone",
  "community.subtitle": "Join prayer circles, share testimonies, and encourage believers — every day, from anywhere.",
  "community.cta": "Explore the Community",
  "testimonials.badge": "Loved by the Watch",
  "testimonials.title": "Stories from the altar"
}
```

#### `auth.json` — Login/Signup/Password pages

```json
{
  "login.title": "Welcome Back",
  "login.subtitle": "Sign in to your account",
  "login.email": "Email address",
  "login.password": "Password",
  "login.submit": "Sign In",
  "login.forgotPassword": "Forgot password?",
  "login.noAccount": "Don't have an account?",
  "login.signUp": "Sign up",
  "login.social.google": "Continue with Google",
  "signup.title": "Create Account",
  "signup.subtitle": "Join the global altar watch",
  "signup.name": "Full name",
  "signup.email": "Email address",
  "signup.password": "Password",
  "signup.confirmPassword": "Confirm password",
  "signup.submit": "Create Account",
  "signup.hasAccount": "Already have an account?",
  "signup.signIn": "Sign in",
  "signup.terms": "By creating an account, you agree to our <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>.",
  "verify.title": "Verify Your Email",
  "verify.subtitle": "We sent a verification code to {{email}}",
  "forgot.title": "Reset Password",
  "forgot.subtitle": "Enter your email and we'll send you a reset link"
}
```

#### `dashboard.json` — Sidebar, topbar, overview

```json
{
  "sidebar.overview": "Overview",
  "sidebar.calendar": "My Calendar",
  "sidebar.bible": "Bible Reading",
  "sidebar.prayer": "Prayer",
  "sidebar.worship": "Praise & Worship",
  "sidebar.feed": "Community Feed",
  "sidebar.messages": "Messages",
  "sidebar.groups": "Groups",
  "sidebar.booking": "Book a Slot",
  "sidebar.settings": "Settings",
  "sidebar.admin": "Admin Portal",
  "sidebar.users": "User Management",
  "sidebar.reports": "Moderation",
  "sidebar.coordinator": "Coordinator",
  "sidebar.board": "Board",
  "sidebar.help": "Help & Support",
  "sidebar.legal": "Legal",
  "topbar.search": "Search...",
  "topbar.notifications": "Notifications",
  "topbar.commandPalette": "Command palette",
  "overview.welcome": "Welcome back, {{name}}",
  "overview.streakDays": "{{count}} day streak",
  "overview.todaySchedule": "Today's Schedule",
  "overview.quickActions": "Quick Actions"
}
```

> **NOTE**: Additional namespaces (`bible.json`, `prayer.json`, `worship.json`, `calendar.json`, `messages.json`, `groups.json`, `feed.json`, `booking.json`, `settings.json`, `admin.json`, `notifications.json`, `legal.json`, `errors.json`) follow the same flat key pattern. English strings will be extracted from each page's hardcoded text during implementation.

---

## Phase 3 — Component Migration

### 3.1 Migration Pattern

Every component with hardcoded English strings gets refactored:

**Before** (hardcoded):
```tsx
<Button>Get Started Free</Button>
<p>A modern Christian community platform...</p>
```

**After** (next-intl for public pages):
```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("landing");
// ...
<Button>{t("hero.cta")}</Button>
<p>{t("hero.subtitle")}</p>
```

**After** (react-i18next for dashboard):
```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation("dashboard");
// ...
<Button>{t("sidebar.overview")}</Button>
```

### 3.2 Files to Migrate (Prioritized)

#### Priority 1 — Infrastructure & Layout (do first)

| File | Library | Namespace |
|---|---|---|
| `app/layout.tsx` → `app/[locale]/layout.tsx` | next-intl | — |
| `app/(dashboard)/layout.tsx` | react-i18next | `common` |
| `proxy.ts` | next-intl middleware | — |
| `next.config.ts` | next-intl plugin | — |
| `prisma/schema.prisma` | — | — |

#### Priority 2 — Public Pages (high SEO impact)

| File | Namespace |
|---|---|
| `components/landing/landing-content.tsx` | `landing`, `common` |
| `components/login-card.tsx` | `auth` |
| `components/login-form.tsx` | `auth` |
| `components/signup-form.tsx` | `auth` |
| `components/verify.tsx` | `auth` |
| `app/terms/page.tsx` | `legal` |
| `app/privacy/page.tsx` | `legal` |
| `app/cookies/page.tsx` | `legal` |
| `app/not-found.tsx` | `errors` |
| `app/error.tsx` | `errors` |
| `components/blocks/footer/footer-section-two.tsx` | `common` |

#### Priority 3 — Dashboard Shell

| File | Namespace |
|---|---|
| `components/app-sidebar.tsx` | `dashboard` |
| `components/nav-main.tsx` | `dashboard` |
| `components/nav-user.tsx` | `common`, `dashboard` |
| `components/dashboard/Topbar.tsx` | `dashboard` |
| `components/dashboard/MobileDock.tsx` | `dashboard` |
| `components/dashboard/CommandPalette.tsx` | `dashboard` |

#### Priority 4 — Dashboard Pages

| File | Namespace |
|---|---|
| `app/(dashboard)/overview/page.tsx` | `dashboard` |
| `app/(dashboard)/bible/page.tsx` | `bible` |
| `app/(dashboard)/prayer/page.tsx` | `prayer` |
| `app/(dashboard)/worship/page.tsx` | `worship` |
| `app/(dashboard)/calendar/page.tsx` | `calendar` |
| `app/(dashboard)/messages/page.tsx` | `messages` |
| `app/(dashboard)/groups/page.tsx` | `groups` |
| `app/(dashboard)/feed/page.tsx` | `feed` |
| `app/(dashboard)/booking/page.tsx` | `booking` |
| `app/(dashboard)/settings/page.tsx` | `settings` |
| `app/(dashboard)/admin/page.tsx` | `admin` |
| `app/(dashboard)/notifications/page.tsx` | `notifications` |

#### Priority 5 — Shared Components

| File | Namespace |
|---|---|
| `components/EmptyState.tsx` | `common` |
| `components/booking/*` | `booking` |
| `components/calendar/*` | `calendar` |
| `components/messages/*` | `messages` |
| `components/settings/*` | `settings` |
| `components/onboarding/*` | `onboarding` |
| `components/verse/VerseCard.tsx` | `common` |

---

## Phase 4 — Language Switcher UI

### 4.1 Public Pages — `LocaleSwitcher.tsx`

A dropdown using shadcn `DropdownMenu` + `react-circle-flags` for flag icons:

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { CircleFlag } from "react-circle-flags";
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS } from "@/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    // Replace /current-locale/ prefix with /new-locale/
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CircleFlag countryCode={LOCALE_FLAGS[locale]} height={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {LOCALES.map((loc) => (
          <DropdownMenuItem key={loc} onClick={() => switchLocale(loc)}>
            <CircleFlag countryCode={LOCALE_FLAGS[loc]} height={16} />
            {LOCALE_NAMES[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4.2 Dashboard — `DashboardLocaleSwitcher.tsx`

Similar component but uses `i18next.changeLanguage()` instead of URL routing, and persists to the `NEXT_LOCALE` cookie + `User.preferredLocale` via API call.

### 4.3 Placement

- **Landing navbar** (desktop): Between theme toggle and sign-in buttons
- **Landing navbar** (mobile sheet): Below nav items, above auth buttons
- **Dashboard sidebar footer**: Below user avatar menu
- **Settings page**: "Language" section with radio group

---

## Phase 5 — Date & Number Formatting

### 5.1 Locale-Aware Formatter Utility

#### [NEW] `lib/formatters.ts`

```typescript
import { Locale } from "@/i18n/config";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
};

export function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(d);
}

export function formatTime(date: Date | string, locale: Locale) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE_MAP[locale], options).format(value);
}

export function formatRelativeTime(date: Date, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE_MAP[locale], { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(diffDay, "day");
}
```

### 5.2 Hook — `useLocaleFormatter`

```typescript
"use client";

import { useTranslation } from "react-i18next";
import { formatDate, formatTime, formatNumber, formatRelativeTime } from "@/lib/formatters";
import type { Locale } from "@/i18n/config";

export function useLocaleFormatter() {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "en") as Locale;

  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    formatTime: (date: Date | string) => formatTime(date, locale),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),
    formatRelativeTime: (date: Date) => formatRelativeTime(date, locale),
  };
}
```

---

## Phase 6 — SEO & Metadata

### 6.1 Localized Metadata

Each public page generates locale-aware metadata with `hreflang` alternates:

```typescript
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}`])
      ),
    },
  };
}
```

### 6.2 Sitemap

Update `app/sitemap.ts` to emit localized URLs with `hreflang` alternates for all supported locales.

---

## Phase 7 — Notification & Email Localization

### 7.1 Email Templates

Email notifications (verification, password reset, slot reminders) should be sent in the user's `preferredLocale`:

```typescript
// In notification dispatch logic:
const user = await prisma.user.findUnique({ where: { id: userId } });
const locale = user?.preferredLocale || "en";
const template = await loadEmailTemplate("slot-reminder", locale);
```

### 7.2 Push Notification Text

Push notification titles and bodies should also be locale-aware, reading from the same JSON namespace files server-side:

```typescript
import fs from "fs/promises";

async function getServerTranslation(locale: string, namespace: string, key: string): Promise<string> {
  const messages = JSON.parse(
    await fs.readFile(`./messages/${locale}/${namespace}.json`, "utf-8")
  );
  return messages[key] || key;
}
```

---

## Verification Plan

### Automated Checks

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Build succeeds with next-intl plugin
npm run build

# 3. Lint for missing translation keys (custom script)
node scripts/check-translations.js
```

### Manual Verification

1. **Landing page**: Visit `/`, `/fr/`, `/es/`, `/pt/` — verify translated content, correct `<html lang>`, hreflang meta tags
2. **Language switcher**: Click each language option — verify URL changes (public), cookie changes (dashboard)
3. **Login/Signup**: Switch to French, verify all form labels, placeholders, and validation errors are in French
4. **Dashboard**: Log in, change language in settings — verify sidebar, topbar, page headings all update
5. **Dates**: Check that date pickers and displayed dates use locale-appropriate formatting
6. **Fallback**: Delete a key from `fr/common.json` — verify English fallback renders, no crash
7. **SEO**: Run Lighthouse on `/fr/` — verify title, description, hreflang are correct

---

## Rollout Checklist

- [ ] Install `next-intl`, `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`
- [ ] Create `i18n/config.ts`, `i18n/routing.ts`, `i18n/request.ts`, `i18n/client.ts`
- [ ] Create `messages/en/*.json` — extract all English strings from components
- [ ] Create stub `messages/{fr,es,pt}/*.json` files (copy of English as placeholder)
- [ ] Wrap `next.config.ts` with `createNextIntlPlugin`
- [ ] Restructure public pages under `app/[locale]/`
- [ ] Create `app/[locale]/layout.tsx` with `NextIntlClientProvider`
- [ ] Refactor `app/layout.tsx` to pass-through root layout
- [ ] Integrate `next-intl` middleware into `proxy.ts`
- [ ] Create `providers/I18nProvider.tsx` and wrap `(dashboard)/layout.tsx`
- [ ] Add `preferredLocale` to `User` model + `PATCH /api/v1/locale` endpoint
- [ ] Build `LocaleSwitcher` component (public) and `DashboardLocaleSwitcher` (dashboard)
- [ ] Migrate Priority 2 components (public pages) to `useTranslations()`
- [ ] Migrate Priority 3 components (dashboard shell) to `useTranslation()`
- [ ] Migrate Priority 4 components (dashboard pages)
- [ ] Migrate Priority 5 components (shared components)
- [ ] Create `lib/formatters.ts` and `useLocaleFormatter` hook
- [ ] Add localized metadata to all public pages
- [ ] Update sitemap with hreflang alternates
- [ ] Add translation key linting script
- [ ] Add locale-aware email templates
- [ ] Full manual testing in all 4 locales
- [ ] Provide French, Spanish, Portuguese translations (manual/service)
