import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trendChange?: number
  className?: string
}

function TrendBadge({ change }: { change: number }) {
  const isPositive = change > 0
  const isNeutral = change === 0
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        isNeutral
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      )}
    >
      {isNeutral ? null : isPositive ? (
        <ArrowUpRight className="size-3" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden="true" />
      )}
      {Math.abs(change)}%
    </span>
  )
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trendChange,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          {Icon && (
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {(description || trendChange !== undefined) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {description && (
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {description}
              </span>
            )}
            {trendChange !== undefined && <TrendBadge change={trendChange} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
