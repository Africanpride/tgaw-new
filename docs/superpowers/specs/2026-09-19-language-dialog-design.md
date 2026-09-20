# Language Dialog in Dashboard Specification

## Overview
The dashboard currently renders `DashboardLocaleSwitcher` (a dropdown) as a compact icon button in the sidebar footer (`components/app-sidebar.tsx`). This design moves the language change UI out of the sidebar into a **shadcn Dialog** triggered from the **Topbar**, removing sidebar clutter and giving the switcher more room.

## Key Improvements

### 1. New `LanguageDialog` Component
- **File**: `components/i18n/LanguageDialog.tsx` (self-contained — includes its own trigger).
- **Trigger**: `Button variant="ghost" size="icon"` with a `Globe` icon and translated `aria-label`, placed in the Topbar between the theme toggle and the notifications bell.
- **Dialog content**: title + short description, then the 4 locales (`en`, `fr`, `es`, `pt`) as clickable rows — `CircleFlag` flag (from `react-circle-flags`, consistent with `country-dropdown` usage) + `LOCALE_NAMES` label + `Check` icon on the active locale.

### 2. Switch Logic (Preserved)
- Same as the current dropdown: optimistic `changeLanguage(newLocale)` via `@/i18n/client`, `NEXT_LOCALE` cookie write (`path=/; max-age=31536000; samesite=lax`), and fire-and-forget `PATCH /api/v1/locale` (DB + cookie persistence).
- Dialog closes on select (fast, dropdown-equivalent UX).

### 3. Sidebar Cleanup
- Remove the `<DashboardLocaleSwitcher compact />` footer block and its import from `components/app-sidebar.tsx`.
- Delete `components/i18n/DashboardLocaleSwitcher.tsx` (its only consumer was the sidebar).

### 4. i18n Keys
- Add `topbar.changeLanguage` (trigger aria-label / dialog title) and `topbar.languageDescription` to `messages/{en,fr,es,pt}/dashboard.json`.

### 5. Accessibility
- shadcn Dialog provides focus trap, Esc-to-close, and focus rings.
- All icons `aria-hidden="true"`; locale rows keyboard navigable (`role="radiogroup"` semantics via labelled buttons).

## File Targets
1. [components/i18n/LanguageDialog.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/i18n/LanguageDialog.tsx) — NEW
2. [components/dashboard/Topbar.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/dashboard/Topbar.tsx) — add trigger
3. [components/app-sidebar.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/app-sidebar.tsx) — remove footer switcher
4. [components/i18n/DashboardLocaleSwitcher.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/i18n/DashboardLocaleSwitcher.tsx) — DELETE
5. `messages/{en,fr,es,pt}/dashboard.json` — add keys

## Verification Plan
1. Type checking via `bun run typecheck` (or `npx tsc --noEmit` if no script exists).
2. Build verification via `bun run build`.
