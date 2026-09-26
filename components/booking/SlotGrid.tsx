"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { CalendarX2, CalendarClock, Check, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SlotData } from "./SlotCell"
import { convertUtcTimeToLocal, isCurrentSlot, isPastSlot } from "./slotTime"
import { slotAccent } from "./slotAccent"
import type { SlotAccent } from "./slotAccent"
import { EventBlockBadge } from "./EventBlockPopover"
import { EventType } from "@prisma/client"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface SlotGridProps {
  slots: SlotData[]
  type: EventType
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEmptyAction?: () => void
}

export function SlotGrid({
  slots,
  type,
  selectedIds,
  onSelectionChange,
  onEmptyAction,
}: SlotGridProps) {
  const { t } = useTranslation("booking")
  const visibleSlots = slots.filter((s) => !isPastSlot(s) || isCurrentSlot(s))
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const accent = slotAccent[type]

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
      <Card className="flex h-full items-center justify-center gap-3 py-14 text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            accent.iconTile
          )}
        >
          <CalendarX2 className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium">{t("empty.noSlotsTitle")}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t("empty.noSlotsDesc")}
        </p>
        {onEmptyAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEmptyAction}
            className="mt-1"
          >
            {t("empty.pickAnotherDay")}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card className="h-full w-full max-w-full">
      <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSlots.map((slot) => (
          <SlotGridCell
            key={slot.id}
            slot={slot}
            isSelected={selectedIds.includes(slot.id)}
            onSelect={handleSelect}
            accent={accent}
            isCurrent={isCurrentSlot(slot)}
          />
        ))}
      </div>
    </Card>
  )
}

interface SlotGridCellProps {
  slot: SlotData
  isSelected: boolean
  onSelect: (id: string, shiftKey: boolean) => void
  accent: SlotAccent
  isCurrent?: boolean
}

function SlotGridCell({
  slot,
  isSelected,
  onSelect,
  accent,
  isCurrent,
}: SlotGridCellProps) {
  const { t } = useTranslation("booking")
  const past = isPastSlot(slot)
  const isBlocked = !!slot.eventId
  const isAvailable = !slot.isBooked && !past && !isBlocked

  const statusLabel = past
    ? t("aria.past")
    : isBlocked
      ? slot.event
        ? t("aria.reservedTitled", { title: slot.event.title })
        : t("aria.reserved")
      : isAvailable
        ? isSelected
          ? t("aria.selected")
          : t("aria.available")
        : t("aria.booked")

  return (
    <motion.div
      layout={isSelected}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      onClick={(e) => onSelect(slot.id, e.shiftKey)}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
      aria-label={t("aria.slotRange", {
        start: convertUtcTimeToLocal(slot.startTime),
        end: convertUtcTimeToLocal(slot.endTime),
        status: statusLabel,
        current: isCurrent ? t("aria.current") : "",
      })}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect(slot.id, e.shiftKey)
        }
      }}
      data-slot-id={slot.id}
      className={cn(
        "flex min-h-[64px] flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-2 text-left transition-all duration-300 ease-out outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-3 dark:border-white/10 dark:bg-[#0B1121]",
        past ? "cursor-default opacity-40" : "cursor-pointer",
        isBlocked &&
          !past &&
          "cursor-not-allowed border-violet-500/40 bg-violet-500/10 dark:bg-violet-500/20",
        !past &&
          isAvailable &&
          "hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:bg-[#0F172A]",
        !past && !isAvailable && !isBlocked && "cursor-not-allowed opacity-60",
        isSelected && isAvailable && cn(accent.tint, "border-primary/40"),
        slot.isOwnBooking &&
          !past &&
          cn(accent.tintStrong, "border-primary/20"),
        isCurrent && !past && "ring-1 ring-primary/30 ring-inset"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {convertUtcTimeToLocal(slot.startTime)}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            &ndash; {convertUtcTimeToLocal(slot.endTime)}
          </span>
        </span>
        {isSelected && isAvailable && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full",
              accent.solid
            )}
          >
            <Check className="size-3" aria-hidden="true" />
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {past ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
            <Clock className="size-3" aria-hidden="true" />
            {t("chip.past")}
          </span>
        ) : isBlocked ? (
          <EventBlockBadge event={slot.event}>
            <CalendarClock className="size-3" aria-hidden="true" />
            {t("chip.event")}
          </EventBlockBadge>
        ) : isAvailable ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isSelected ? accent.dotStrong : "bg-muted-foreground/40"
              )}
            />
            {isSelected ? t("chip.selected") : t("chip.available")}
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <Badge
              variant={slot.isOwnBooking ? "default" : "secondary"}
              className={cn(slot.isOwnBooking && cn(accent.solid))}
            >
              {slot.isOwnBooking ? t("chip.myBooking") : t("chip.booked")}
            </Badge>
            {slot.bookedByName && (
              <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
                <UserAvatar
                  name={slot.bookedByName}
                  image={slot.bookedByImage}
                  className="size-5"
                />
                <span className="truncate text-xs font-medium">
                  {slot.bookedByName}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
