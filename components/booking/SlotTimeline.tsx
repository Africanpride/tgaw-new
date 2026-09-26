"use client"

import { useMemo, useState } from "react"
import { CalendarX2, ChevronDown } from "lucide-react"
import { SlotCell, SlotData } from "./SlotCell"
import { isPastSlot, isCurrentSlot } from "./slotTime"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import { slotAccent } from "./slotAccent"
import { EventType } from "@prisma/client"
import { useTranslation } from "react-i18next"

const INITIAL_VISIBLE = 8

interface SlotTimelineProps {
  slots: SlotData[]
  type: EventType
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEmptyAction?: () => void
}

export function SlotTimeline({
  slots,
  type,
  selectedIds,
  onSelectionChange,
  onEmptyAction,
}: SlotTimelineProps) {
  const { t } = useTranslation("booking")
  const visibleSlots = useMemo(
    () => slots.filter((s) => !isPastSlot(s) || isCurrentSlot(s)),
    [slots]
  )
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const accent = slotAccent[type]

  const shownSlots = expanded
    ? visibleSlots
    : visibleSlots.slice(0, INITIAL_VISIBLE)

  const handleSelect = (id: string, shiftKey: boolean) => {
    const targetSlot = visibleSlots.find((s) => s.id === id)
    const isBlocked = !!targetSlot?.eventId
    if (
      !targetSlot ||
      targetSlot.isBooked ||
      isPastSlot(targetSlot) ||
      isBlocked
    )
      return

    if (shiftKey && lastSelectedId) {
      const startIndex = visibleSlots.findIndex((s) => s.id === lastSelectedId)
      const endIndex = visibleSlots.findIndex((s) => s.id === id)
      const min = Math.min(startIndex, endIndex)
      const max = Math.max(startIndex, endIndex)
      const newSelection: string[] = []
      let canSelectAll = true
      for (let i = min; i <= max; i++) {
        const slotIsBlocked = !!visibleSlots[i].eventId
        if (
          visibleSlots[i].isBooked ||
          isPastSlot(visibleSlots[i]) ||
          slotIsBlocked
        ) {
          canSelectAll = false
          break
        }
        newSelection.push(visibleSlots[i].id)
      }
      if (canSelectAll) {
        onSelectionChange(
          Array.from(new Set([...selectedIds, ...newSelection]))
        )
      }
    } else {
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((sId) => sId !== id)
          : [...selectedIds, id]
      )
      setLastSelectedId(id)
    }
  }

  if (visibleSlots.length === 0) {
    return (
      <Card className="h-full w-full max-w-full">
        <EmptyState
          icon={CalendarX2}
          title={t("empty.noSlotsTitle")}
          description={t("empty.noSlotsDesc")}
          actionLabel={onEmptyAction ? t("empty.pickAnotherDay") : undefined}
          onAction={onEmptyAction}
        />
      </Card>
    )
  }

  return (
    <Card className="h-full w-full max-w-full">
      <div className="flex flex-col">
        {shownSlots.map((slot) => (
          <SlotCell
            key={slot.id}
            slot={slot}
            isSelected={selectedIds.includes(slot.id)}
            onSelect={handleSelect}
            accent={accent}
            isCurrent={isCurrentSlot(slot)}
          />
        ))}
        {!expanded && visibleSlots.length > INITIAL_VISIBLE && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border-t bg-muted/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("showMore", { count: visibleSlots.length - INITIAL_VISIBLE })}
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  )
}
