"use client"

import * as React from "react"
import { Settings2 } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { useConsent } from "./ConsentProvider"
import { useConsentTranslation } from "@/lib/consent/translations"

export function CookieSettingsButton() {
  const { hasConsented, showBanner, openCustomize, openBanner } = useConsent()
  const { t } = useConsentTranslation()
  const shouldReduceMotion = useReducedMotion()

  // Only show after a choice has been made and banner is not visible
  const visible = hasConsented && !showBanner

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-3 left-3 z-40 sm:bottom-4 sm:left-4"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={openCustomize}
            aria-label={t("manageCookies")}
            className="cursor-pointer rounded-full shadow-md ring-1 ring-foreground/10"
          >
            <Settings2 aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">{t("manageCookies")}</span>
            <span className="sm:hidden">{t("manageCookies")}</span>
          </Button>
          {/* small secondary trigger for re-opening banner — a11y discoverability */}
          <button
            onClick={openBanner}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          >
            {t("bannerTitle")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}