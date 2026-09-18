"use client"

import * as React from "react"
import Link from "next/link"
import { Cookie, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_META } from "@/lib/consent/config"
import { useConsent } from "./ConsentProvider"

export function CookieCustomizeDialog() {
  const { showCustomize, closeCustomize, prefs, region, gpcDetected, savePrefs, acceptAll, rejectAll } = useConsent()

  const [functional, setFunctional] = React.useState(false)
  const [analytics, setAnalytics] = React.useState(false)
  const [marketing, setMarketing] = React.useState(false)

  React.useEffect(() => {
    if (showCustomize) {
      setFunctional(!!prefs?.functional)
      setAnalytics(!!prefs?.analytics)
      setMarketing(!!prefs?.marketing)
      if (!prefs) {
        // GPC default on first open: marketing stays off
        if (gpcDetected) setMarketing(false)
      }
    }
  }, [showCustomize, prefs, gpcDetected])

  const handleSave = () => {
    savePrefs({ necessary: true, functional, analytics, marketing })
  }

  return (
    <Dialog open={showCustomize} onOpenChange={(open) => { if (!open) closeCustomize() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie aria-hidden="true" className="size-4 text-muted-foreground" />
            Customize Cookies
          </DialogTitle>
          <DialogDescription className="text-left">
            Choose which cookies you allow. Necessary cookies are always on.
            {region === "strict" && " Non-essential cookies remain blocked until you consent."}
            {region === "us_opt_out" && " You can opt out of sale/share at any time."}
          </DialogDescription>
        </DialogHeader>

        {gpcDetected && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-xs text-emerald-900 sm:px-3 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-medium">Global Privacy Control honored</span> — your browser signaled “Do Not Sell/Share”. Marketing is off by default; you can still turn it on below.
            </p>
          </div>
        )}

        <div className="space-y-4 py-1">
          {/* Necessary — locked */}
          <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-2 sm:p-3">
            <div className="min-w-0 flex-1">
              <Label className="text-sm font-medium">{CATEGORY_META.necessary.label}</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{CATEGORY_META.necessary.description}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Info aria-hidden="true" className="size-3" /> Always active
              </p>
            </div>
            <Switch checked disabled aria-label="Strictly Necessary — always on" />
          </div>

          {/* Functional */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-2 sm:p-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="c-functional" className="text-sm font-medium">{CATEGORY_META.functional.label}</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{CATEGORY_META.functional.description}</p>
            </div>
            <Switch id="c-functional" checked={functional} onCheckedChange={setFunctional} aria-label="Functional cookies" />
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-2 sm:p-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="c-analytics" className="text-sm font-medium">{CATEGORY_META.analytics.label}</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{CATEGORY_META.analytics.description}</p>
            </div>
            <Switch id="c-analytics" checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-2 sm:p-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="c-marketing" className="text-sm font-medium">{CATEGORY_META.marketing.label}</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{CATEGORY_META.marketing.description}</p>
              {region === "us_opt_out" && (
                <Link href="/cookies#do-not-sell" className="mt-1 inline-block cursor-pointer text-xs underline underline-offset-2">
                  Do Not Sell or Share — learn more
                </Link>
              )}
            </div>
            <Switch id="c-marketing" checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing cookies" />
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Cookie Policy</Link>
            <span className="mx-1.5">·</span>
            <Link href="/privacy" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
          </span>
          <span className="hidden sm:inline">GDPR · CCPA · LGPD</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={rejectAll} className="cursor-pointer">Reject All</Button>
          <Button variant="secondary" onClick={acceptAll} className="cursor-pointer">Accept All</Button>
          <Button onClick={handleSave} className="cursor-pointer">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}