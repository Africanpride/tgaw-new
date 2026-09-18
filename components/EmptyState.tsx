import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/IconTile";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryOnAction?: () => void;
  className?: string;
}

/**
 * Illustrated empty state with a clear call to action. Premium empty states
 * guide the user somewhere instead of dead-ending.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  secondaryOnAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-2 py-14 text-center sm:px-6",
        className,
      )}
    >
      <IconTile icon={Icon} size="lg" tone="bg-background text-muted-foreground shadow-sm" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(actionLabel && (onAction || actionHref)) ||
      (secondaryActionLabel && secondaryOnAction) ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && (onAction || actionHref) && (
            <Button
              size="sm"
              onClick={onAction}
              {...(actionHref ? { asChild: true } : {})}
            >
              {actionHref ? (
                <Link href={actionHref} className="cursor-pointer">
                  {actionLabel}
                </Link>
              ) : (
                actionLabel
              )}
            </Button>
          )}
          {secondaryActionLabel && secondaryOnAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={secondaryOnAction}
              className="cursor-pointer"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}