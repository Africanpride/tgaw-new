"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
	const [date, setDate] = useState<Date | undefined>(new Date());

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
				<p className="text-muted-foreground">Manage your schedule and events</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<Card>
					<CardContent className="pt-6">
						<Calendar
							mode="single"
							selected={date}
							onSelect={setDate}
							className="w-full"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							{date
								? date.toLocaleDateString("en-US", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})
								: "Select a date"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No events scheduled for this day.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
