"use client";

import { useState } from "react";
import { addDays, format, isThisYear, isToday, isTomorrow, parse } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateNav({
	dateStr,
	basePath = "/bible",
}: {
	dateStr: string;
	basePath?: string;
}) {
	const router = useRouter();
	const [pickerOpen, setPickerOpen] = useState(false);

	const current = parse(dateStr, "yyyy-MM-dd", new Date());
	const prev = format(addDays(current, -1), "yyyy-MM-dd");
	const next = format(addDays(current, 1), "yyyy-MM-dd");

	let label: string;
	if (isToday(current)) {
		label = "Today";
	} else if (isTomorrow(current)) {
		label = "Tomorrow";
	} else if (isThisYear(current)) {
		label = format(current, "EEE, MMM d");
	} else {
		label = format(current, "EEE, MMM d, yyyy");
	}

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" size="sm" asChild>
				<Link href={`${basePath}?date=${prev}`} aria-label="Previous day">
					<ChevronLeft className="size-4" aria-hidden="true" />
				</Link>
			</Button>

			<Popover open={pickerOpen} onOpenChange={setPickerOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="min-w-[130px] justify-center gap-1.5 font-medium"
						aria-label={`Pick a date, currently ${format(current, "PPP")}`}
					>
						{label}
						<CalendarDays
							className="size-3.5 text-muted-foreground"
							aria-hidden="true"
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="center">
					<Calendar
						mode="single"
						selected={current}
						defaultMonth={current}
						onSelect={(day) => {
							setPickerOpen(false);
							if (day) {
								router.push(`${basePath}?date=${format(day, "yyyy-MM-dd")}`);
							}
						}}
					/>
				</PopoverContent>
			</Popover>

			<Button variant="outline" size="sm" asChild>
				<Link href={`${basePath}?date=${next}`} aria-label="Next day">
					<ChevronRight className="size-4" aria-hidden="true" />
				</Link>
			</Button>

			{!isToday(current) && (
				<Button variant="ghost" size="sm" asChild className="text-muted-foreground">
					<Link href={basePath}>Today</Link>
				</Button>
			)}
		</div>
	);
}
