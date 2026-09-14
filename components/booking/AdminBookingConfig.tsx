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
        toast.success("Configuration updated successfully")
        router.refresh()
      } else {
        toast.error(data.error?.message || "Failed to update configuration")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <IconTile icon={Settings} size="md" iconClassName="size-4" />
          Booking Configuration
        </CardTitle>
        <CardDescription>
          Set global limits and visibility modes for all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Daily Limits (Slots per user)</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="maxBible">Bible</Label>
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
              <Label htmlFor="maxPrayer">Prayer</Label>
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
              <Label htmlFor="maxWorship">Worship</Label>
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
          <h3 className="text-sm font-medium">Overview Live Grid</h3>
          <div className="grid gap-2 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="liveGridUpcoming">
                Upcoming slots per channel
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
                Live slot + this many upcoming = total cards. 0 = live only, 2 =
                live +2 (default), 5 = live +5. 0–10.
              </p>
            </div>
            <div className="flex items-end pb-2">
              <p className="text-xs text-muted-foreground">
                Total displayed:{" "}
                <span className="font-medium text-foreground">
                  {1 + Number(config.liveGridUpcoming ?? 2)}
                </span>{" "}
                per channel (Bible/Prayer/Worship). 3-col grid.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Visibility Mode</h3>
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
                title: "1. Full Public",
                desc: "Everyone sees who booked every slot.",
              },
              {
                value: "2",
                title: "2. Count Only",
                desc: 'Hide names, show only "Booked".',
              },
              {
                value: "3",
                title: "3. Full Transparency",
                desc: "Show names + prominent empty slots.",
              },
              {
                value: "4",
                title: "4. Role-Scoped (Default)",
                desc: "Leaders see names, members only see availability.",
              },
            ].map((mode) => {
              const selected = String(config.visibilityMode ?? 4) === mode.value
              return (
                <label
                  key={mode.value}
                  htmlFor={`mode${mode.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
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
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  )
}