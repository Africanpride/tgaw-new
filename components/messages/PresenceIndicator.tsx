"use client";

import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
	online: boolean;
	className?: string;
	size?: "sm" | "md";
}

export function PresenceIndicator({ online, className, size = "sm" }: PresenceIndicatorProps) {
	return (
		<span
			className={cn(
				"absolute rounded-full border-2 border-background",
				size === "sm" ? "size-2.5 bottom-0 right-0" : "size-3 bottom-0 right-0",
				online ? "bg-emerald-500" : "bg-muted-foreground/40",
				className,
			)}
			aria-label={online ? "Online" : "Offline"}
		/>
	);
}
