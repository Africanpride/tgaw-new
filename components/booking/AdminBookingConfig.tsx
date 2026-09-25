"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Check, Settings } from "lucide-react"
import { IconTile } from "@/components/IconTile"

export interface BookingConfigData {
  maxBibleSlotsPerDay?: number
  maxPrayerSlotsPerDay?: number
  maxWorshipSlotsPerDay?: number
  visibilityMode?: number
  liveGridUpcoming?: number
}

export function AdminBookingConfig({
  initialConfig,
}: {
  initialConfig: BookingConfigData | null
}) {
  const [config, setConfig] = useState<BookingConfigData>(
    initialConfig || {
      maxBibleSlotsPerDay: 1,
      maxPrayerSlotsPerDay: 1,
      maxWorshipSlotsPerDay: 1,
      visibilityMode: 4,
      liveGridUpcoming: 2,
    }
  )
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { t } = useTranslation("admin")
  const { t: tb } = useTranslation("booking")

  useEffect(() => {
    if (initialConfig) setConfig((prev) => ({ ...prev, ...initialConfig }))
  }, [initialConfig])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/slots/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxBibleSlotsPerDay: Number(config.maxBibleSlotsPerDay),
          maxPrayerSlotsPerDay: Number(config.maxPrayerSlotsPerDay),
          maxWorshipSlotsPerDay: Number(config.maxWorshipSlotsPerDay),
          visibilityMode: Number(config.visibilityMode),
          liveGridUpcoming: Number(config.liveGridUpcoming ?? 2),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(t("config.toastSaved"))
        router.refresh()
      } else {
        toast.error(data.error?.message || t("config.toastFailed"))
      }
    } catch {
      toast.error(t("action.error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <IconTile icon={Settings} size="md" iconClassName="size-4" />
          {t("config.title")}
        </CardTitle>
        <CardDescription>{t("config.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t("config.dailyLimits")}</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="maxBible">{tb("type.bibleShort")}</Label>
              <Input
                id="maxBible"
                type="number"
                value={config.maxBibleSlotsPerDay ?? 1}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxBibleSlotsPerDay: Number(e.target.value),
                  })
                }
                min={0}
                max={24}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPrayer">{tb("type.prayer")}</Label>
              <Input
                id="maxPrayer"
                type="number"
                value={config.maxPrayerSlotsPerDay ?? 1}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxPrayerSlotsPerDay: Number(e.target.value),
                  })
                }
                min={0}
                max={24}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWorship">{tb("type.worshipShort")}</Label>
              <Input
                id="maxWorship"
                type="number"
                value={config.maxWorshipSlotsPerDay ?? 1}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxWorshipSlotsPerDay: Number(e.target.value),
                  })
                }
                min={0}
                max={24}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t("config.liveGrid")}</h3>
          <div className="grid gap-2 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="liveGridUpcoming">
                {t("config.upcomingPerChannel")}
              </Label>
              <Input
                id="liveGridUpcoming"
                type="number"
                value={config.liveGridUpcoming ?? 2}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    liveGridUpcoming: Number(e.target.value),
                  })
                }
                min={0}
                max={10}
              />
              <p className="text-xs text-muted-foreground">
                {t("config.liveGridHint")}
              </p>
            </div>
            <div className="flex items-end pb-2">
              <p className="text-xs text-muted-foreground">
                {t("config.totalDisplayed", {
                  count: 1 + Number(config.liveGridUpcoming ?? 2),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t("config.visibilityMode")}</h3>
          <RadioGroup
            value={String(config.visibilityMode ?? 4)}
            onValueChange={(v) =>
              setConfig({ ...config, visibilityMode: Number(v) })
            }
            className="gap-2"
          >
            {[
              {
                value: "1",
                title: t("config.mode1Title"),
                desc: t("config.mode1Desc"),
              },
              {
                value: "2",
                title: t("config.mode2Title"),
                desc: t("config.mode2Desc"),
              },
              {
                value: "3",
                title: t("config.mode3Title"),
                desc: t("config.mode3Desc"),
              },
              {
                value: "4",
                title: t("config.mode4Title"),
                desc: t("config.mode4Desc"),
              },
            ].map((mode) => {
              const selected = String(config.visibilityMode ?? 4) === mode.value
              return (
                <label
                  key={mode.value}
                  htmlFor={`mode${mode.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-2 sm:p-3 transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem
                    value={mode.value}
                    id={`mode${mode.value}`}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span
                      className={cn(
                        "text-sm",
                        selected
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground"
                      )}
                    >
                      {mode.title}
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mode.desc}
                    </p>
                  </div>
                  {selected && (
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </label>
              )
            })}
          </RadioGroup>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("action.saving") : t("config.saveConfiguration")}
        </Button>
      </CardContent>
    </Card>
  )
}