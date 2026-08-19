import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
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
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
        <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionLabel && (onAction || actionHref) && (
        <Button
          size="sm"
          className="mt-1"
          onClick={onAction}
          {...(actionHref ? { asChild: true } : {})}
        >
          {actionHref ? (
            <a href={actionHref} className="cursor-pointer">
              {actionLabel}
            </a>
          ) : (
            actionLabel
          )}
        </Button>
      )}
    </div>
  );
}