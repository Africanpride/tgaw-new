"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
	users: { userId: string; name: string }[];
	className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
	if (users.length === 0) return null;

	const names =
		users.length === 1
			? users[0].name
			: users.length === 2
				? `${users[0].name} and ${users[1].name}`
				: `${users[0].name} and ${users.length - 1} others`;

	return (
		<div className={cn("flex items-center gap-2 px-4 py-1.5", className)}>
			<div className="flex items-center gap-0.5">
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
			</div>
			<span className="text-xs text-muted-foreground">
				{names} {users.length === 1 ? "is" : "are"} typing…
			</span>
		</div>
	);
}
