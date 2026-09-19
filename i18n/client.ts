"use client";

import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";

// Dashboard namespaces — loaded lazily per page via /api/v1/messages.
export const DASHBOARD_NAMESPACES = [
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
  "onboarding",
  "errors",
];

if (!i18n.isInitialized) {
  void i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: [...LOCALES],
      fallbackLng: DEFAULT_LOCALE,
      defaultNS: "common",
      ns: DASHBOARD_NAMESPACES,

      // Served by app/api/v1/i18n/[locale]/[namespace]/route.ts
      // (single source of truth stays in /messages).
      backend: {
        loadPath: "/api/v1/i18n/{{lng}}/{{ns}}.json",
      },

      detection: {
        order: ["cookie", "navigator"],
        caches: ["cookie"],
        lookupCookie: LOCALE_COOKIE_NAME,
        cookieOptions: { path: "/", sameSite: "lax" },
      },

      interpolation: {
        escapeValue: false, // React already escapes
      },

      react: {
        useSuspense: true,
      },
    });
}

export default i18n;

/** Switch the dashboard locale (cookie-based, no URL prefix). */
export function changeLanguage(locale: Locale) {
  return i18n.changeLanguage(locale);
}
