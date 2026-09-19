"use client";

import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/client";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nextProvider>
  );
}
