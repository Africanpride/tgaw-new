"use client";

import {
	type CalendarEvent,
	CalendarView,
} from "@/components/calendar/calendar-view";

const sampleEvents: CalendarEvent[] = [
	{
		id: "1",
		title: "Team Standup",
		color: "blue",
		date: new Date(2026, 7, 11),
	},
	{
		id: "2",
		title: "Design Review",
		color: "purple",
		date: new Date(2026, 7, 11),
	},
	{
		id: "3",
		title: "Product Launch",
		color: "green",
		date: new Date(2026, 7, 15),
	},
	{
		id: "4",
		title: "Client Presentation",
		color: "orange",
		date: new Date(2026, 7, 18),
	},
];

export default function CalendarPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
				<p className="text-muted-foreground">Manage your schedule and events</p>
			</div>

			<CalendarView events={sampleEvents} />
		</div>
	);
}
