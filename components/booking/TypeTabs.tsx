"use client"

import { EventType } from "@prisma/client"
import { BookOpen, HandHeart, Music } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { slotAccent } from "./slotAccent"

interface TypeTabsProps {
  value: EventType
  onChange: (value: EventType) => void
}

const TABS: { value: EventType; labelKey: string; icon: typeof BookOpen }[] = [
  { value: "BIBLE", labelKey: "type.bible", icon: BookOpen },
  { value: "PRAYER", labelKey: "type.prayer", icon: HandHeart },
  { value: "PRAISE_WORSHIP", labelKey: "type.worship", icon: Music },
]

export function TypeTabs({ value, onChange }: TypeTabsProps) {
  const { t } = useTranslation("booking")
  return (
    <div className="grid w-full grid-cols-3 gap-2" role="tablist">
      {TABS.map(({ value: v, labelKey, icon: Icon }) => {
        const isActive = value === v
        const accent = slotAccent[v]
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v)}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? cn(
                    "border-2 bg-card font-semibold shadow-2xs",
                    accent.tabBorder
                  )
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? accent.iconText : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span className="truncate text-xs">{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
