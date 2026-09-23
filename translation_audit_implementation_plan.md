# Admin-Controlled Translation Enable/Disable Feature

Add per-language enable/disable checkboxes to the Admin page so that a **superadmin** can control which translations (fr, es, pt) are available across the entire app. English is always on and cannot be disabled.

## Design Decisions (Resolved via Interview)

| Decision | Resolution |
|---|---|
| English toggleable? | **No** — English is always on; only fr, es, pt are toggleable |
| UI placement | New card on existing `/admin` page |
| Storage | **Database** — new `TranslationConfig` singleton model |
| Default state (fresh deploy) | **All disabled** — admin must explicitly enable each language |
| Disabled language fallback | **Silent fallback to English** — no error, no toast |
| Who can toggle? | **`superadmin` only** |
| Scope of toggle | **Both** public pages (next-intl URLs) and dashboard language selector |
| API endpoint | `GET /api/v1/config/translations` (public, cached) + `PATCH` (superadmin only) |
| Language set | **Fixed** — en, fr, es, pt only; no dynamic language addition |
| Audit logging | **Yes** — log to existing `AuditLog` system |

---

## Proposed Changes

### 1. Prisma Schema

#### [MODIFY] [schema.prisma](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/prisma/schema.prisma)

Add `TranslationConfig` singleton model (same pattern as `BookingConfig`):

```prisma
model TranslationConfig {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  enableFr  Boolean  @default(false)
  enableEs  Boolean  @default(false)
  enablePt  Boolean  @default(false)
  updatedBy String                 // last superadmin who changed config
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}
```

Add new values to the `AuditAction` and `AuditTargetType` enums:

```diff
enum AuditAction {
  ...
+ TRANSLATION_CONFIG_CHANGE
}

enum AuditTargetType {
  ...
+ TranslationConfig
}
```

After schema changes, run `npx prisma generate` (and `npx prisma db push` if needed).

---

### 2. Audit Service

#### [MODIFY] [auditService.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/services/auditService.ts)

Add `TRANSLATION_CONFIG_CHANGE` to `ACTION_LEVEL` (as `"warn"`) and `ACTION_SERVICE` (as `"admin"`).

---

### 3. Translation Config Service

#### [NEW] `lib/services/translationConfigService.ts`

Thin Prisma query layer:
- `getTranslationConfig()` → returns the singleton or a default (`{ enableFr: false, enableEs: false, enablePt: false }`)
- `getEnabledLocales()` → returns `Locale[]` (always includes `"en"`, plus any enabled non-English locales)
- `updateTranslationConfig(data, updatedBy)` → upserts the singleton record

---

### 4. API Endpoints

#### [NEW] `app/api/v1/config/translations/route.ts`

- **`GET`** — Public, no auth required. Returns `{ success: true, data: { enabledLocales: ["en", "fr"] } }`. Response will have appropriate cache headers (`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`).
- **`PATCH`** — Superadmin only. Accepts `{ enableFr?: boolean, enableEs?: boolean, enablePt?: boolean }` (Zod validated). Updates `TranslationConfig`, writes audit log, returns updated config. Calls `revalidateTag("translation-config")` for cache invalidation.

---

### 5. Translation Config Zod Schema

#### [NEW] `lib/schemas/translationConfigSchema.ts`

```typescript
import { z } from "zod"

export const updateTranslationConfigSchema = z.object({
  enableFr: z.boolean().optional(),
  enableEs: z.boolean().optional(),
  enablePt: z.boolean().optional(),
})

export type UpdateTranslationConfigInput = z.infer<typeof updateTranslationConfigSchema>
```

---

### 6. Admin UI Component

#### [NEW] `components/admin/AdminTranslationConfig.tsx`

A `"use client"` card component rendered on the Admin page:
- Fetches current config from `GET /api/v1/config/translations` on mount
- Shows a card with heading "Translation Languages" and description
- Renders **3 checkboxes** (one per language: Français, Español, Português) using shadcn `<Checkbox>` + `<Label>` with flag icons
- Each checkbox toggles independently via `PATCH /api/v1/config/translations`
- Shows toast on success/error
- Only visible to `superadmin` role (checked via session)
- i18n keys added to `admin.json` translation files

---

### 7. Admin Page Integration

#### [MODIFY] [page.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(dashboard)/admin/page.tsx)

- Import and render `<AdminTranslationConfig />` in a new section below the stats cards (before or alongside the Slot Management section)
- Conditionally render only when `role === "superadmin"`

---

### 8. Consumer-Side Filtering

These components currently iterate over the hard-coded `LOCALES` array. They need to filter by enabled locales:

#### [MODIFY] [LanguageDialog.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/i18n/LanguageDialog.tsx)

- Fetch enabled locales from `GET /api/v1/config/translations` (via SWR or `useEffect` + state)
- Filter `LOCALES.map(...)` to only show enabled locales
- If user's current locale is disabled, remain on it visually (no forced switch here — the fallback logic in proxy/config handles that)

#### [MODIFY] [settings/page.tsx `LanguageSection`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/(dashboard)/settings/page.tsx) (lines 491–571)

- Same approach: fetch enabled locales, filter the `LOCALES.map(...)` in `RadioGroup`
- If only English is enabled, show a friendly message instead of a single-option radio group

---

### 9. Enabled-Locales Hook (shared logic)

#### [NEW] `hooks/use-enabled-locales.ts`

A reusable client hook:
```typescript
export function useEnabledLocales(): { locales: Locale[]; isLoading: boolean }
```
- Fetches `GET /api/v1/config/translations` with SWR or simple fetch + cache
- Returns the `enabledLocales` array (always includes `"en"`)
- Used by both `LanguageDialog` and `LanguageSection`

---

### 10. Public Page Locale Routing

#### [MODIFY] [proxy.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/proxy.ts)

- When a request hits a disabled locale URL prefix (e.g., `/fr/` when French is disabled), redirect to the unprefixed (English) version
- Query the `TranslationConfig` from DB (cached in-memory for the request lifecycle) to determine enabled locales
- Update the `LOCALE_PREFIX_RE` pattern dynamically or add a check after the regex match

---

### 11. Translation Files (i18n keys)

#### [MODIFY] `messages/{en,fr,es,pt}/admin.json`

Add translation keys for the new admin section:
```json
{
  "translations": {
    "title": "Translation Languages",
    "description": "Enable or disable languages available to users across the app. English is always available.",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "saved": "Translation settings saved",
    "saveFailed": "Failed to save translation settings"
  }
}
```

---

## Open Questions

> [!IMPORTANT]
> **Sitemap & hreflang**: The [sitemap.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/sitemap.ts) and public page `<head>` elements (in `[locale]/layout.tsx`) likely emit `hreflang` alternate links for all locales. Should disabled locales be excluded from the sitemap and hreflang tags? **My recommendation**: Yes — omit disabled locales from sitemap and hreflang to avoid SEO issues with dead locale URLs.

> [!NOTE]
> **next-intl routing config**: The [`i18n/routing.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/i18n/routing.ts) file exports a static `locales` array used by next-intl middleware. Since this is evaluated at build time, the proxy-level redirect (step 10) is the correct place to enforce disabled locales at runtime rather than modifying the static routing config.

---

## Verification Plan

### Automated Tests
```bash
npx prisma generate          # Ensure schema compiles
npm run build                # Ensure no TypeScript errors
npm run i18n:check           # Ensure translation key parity
```

### Manual Verification
1. **Fresh state**: Visit `/admin` as superadmin → all 3 language checkboxes are unchecked (disabled by default)
2. **Enable French**: Check the French checkbox → toast success → visit Settings → only English + French shown in language selector
3. **Public page**: Visit `/fr/` → page loads in French. Visit `/es/` → redirected to `/` (Spanish disabled)
4. **Disable French**: Uncheck French → user with `preferredLocale: "fr"` silently falls back to English on next page load
5. **Non-superadmin**: Login as `leader` → translation config section NOT visible on `/admin`
6. **Language Dialog**: Open language dialog in topbar → only enabled languages shown
7. **Audit log**: After toggling → new `TRANSLATION_CONFIG_CHANGE` entry appears in `/admin/audit-logs`
