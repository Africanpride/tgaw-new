"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Cookie, ShieldCheck, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useConsent } from "./ConsentProvider"

export function CookieBanner() {
  const {
    showBanner,
    region,
    gpcDetected,
    acceptAll,
    rejectAll,
    openCustomize,
    dismissBanner,
  } = useConsent()
  const shouldReduceMotion = useReducedMotion()

  if (!showBanner) return null

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop for strict regions on mobile — subtle */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
            aria-hidden="true"
            onClick={region === "strict" ? undefined : dismissBanner}
          />
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-banner-title"
            aria-describedby="cookie-banner-desc"
            initial={
              shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 32 }
            }
            className={cn(
              "fixed right-0 bottom-0 z-50 mx-auto w-full max-w-2xl p-3 sm:p-4",
              "pointer-events-none"
            )}
          >
            <div className="pointer-events-auto overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-foreground/5">
              {/* Header */}
              <div className="flex items-center gap-2 border-b px-2 py-2 sm:px-4 sm:py-3">
                <Cookie
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span id="cookie-banner-title" className="text-sm font-medium">
                  Cookie Preferences
                </span>
                {gpcDetected && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck aria-hidden="true" className="size-3" /> GPC
                    honored
                  </span>
                )}
                {region === "us_opt_out" && !gpcDetected && (
                  <span className="ml-auto hidden items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
                    <Globe aria-hidden="true" className="size-3" /> US · opt-out
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="border-b px-2 py-2 sm:px-4 sm:py-3">
                <p
                  id="cookie-banner-desc"
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  We use cookies to improve your experience, analyze site
                  traffic, and personalize content.
                  {region === "strict"
                    ? " You can choose which cookies to allow — non-essential cookies stay off until you consent."
                    : region === "us_opt_out"
                      ? " You can manage preferences or opt out of sale/share at any time."
                      : " Manage your preferences below."}{" "}
                  {gpcDetected && (
                    <span className="font-medium text-foreground">
                      Global Privacy Control detected — marketing cookies are
                      off by default.{" "}
                    </span>
                  )}
                </p>
                <Link
                  href="/privacy"
                  className="mt-1.5 inline-block cursor-pointer text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  Read our Privacy Policy
                </Link>
                {region === "us_opt_out" && (
                  <Link
                    href="/cookies#do-not-sell"
                    className="ml-3 inline-block cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Do Not Sell or Share
                  </Link>
                )}
              </div>

              {/* Actions — equal prominence per CNIL/ICO */}
              <div className="px-2 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 flex-1 cursor-pointer text-xs"
                    onClick={acceptAll}
                  >
                    Accept All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 cursor-pointer text-xs"
                    onClick={rejectAll}
                  >
                    Reject All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1 cursor-pointer text-xs"
                    onClick={openCustomize}
                  >
                    Customize
                  </Button>
                </div>
              </div>

              {/* Footer compliance tag */}
              <div className="bg-muted/40 px-2 py-2.5 sm:px-4">
                <p className="text-center text-xs text-muted-foreground">
                  GDPR · CCPA · LGPD compliant
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
