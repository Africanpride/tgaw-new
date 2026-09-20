"use client"

import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConsent } from "./ConsentProvider"
import { useConsentTranslation } from "@/lib/consent/translations"

export function CookieManageButton() {
  const { openCustomize, openBanner, hasConsented } = useConsent()
  const { t } = useConsentTranslation()
  return (
    <Button onClick={hasConsented ? openCustomize : openBanner} className="cursor-pointer gap-2">
      <Settings2 aria-hidden="true" className="size-4" />
      {t("managePreferences")}
    </Button>
  )
}