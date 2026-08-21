"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CalendarEmptyState({
	onCreateEvent,
	canCreate = false,
}: {
	onCreateEvent: () => void;
	canCreate?: boolean;
}) {
	return (
		<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-muted">
				<CalendarDays
					className="size-8 text-muted-foreground/50"
					aria-hidden="true"
				/>
			</div>
			<div className="space-y-1">
				<h3 className="text-lg font-semibold">
					No bookings or events this month
				</h3>
				<p className="mx-auto max-w-sm text-sm text-muted-foreground">
					Book a devotional slot to get started.
				</p>
			</div>
			{canCreate && (
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button asChild>
						<Link href="/bible" className="cursor-pointer">
							Book a Slot
						</Link>
					</Button>
					<Button variant="outline" onClick={onCreateEvent}>
						Create Event
					</Button>
				</div>
			)}
		</div>
	);
}