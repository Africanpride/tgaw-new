"use client";

import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export function CalendarEmptyState({
	onCreateEvent,
	canCreate = false,
}: {
	onCreateEvent: () => void;
	canCreate?: boolean;
}) {
	return (
		<EmptyState
			icon={CalendarDays}
			title="No bookings or events this month"
			description="Book a devotional slot to get started."
			actionLabel={canCreate ? "Book a Slot" : undefined}
			actionHref={canCreate ? "/bible" : undefined}
			secondaryActionLabel={canCreate ? "Create Event" : undefined}
			secondaryOnAction={canCreate ? onCreateEvent : undefined}
			className="h-full min-h-[400px] border-0 bg-transparent"
		/>
	);
}
