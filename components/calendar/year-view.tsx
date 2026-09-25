"use client";

import { addMonths, format, isSameDay, isSameMonth, startOfYear } from "date-fns";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
	CALENDAR_COLORS,
	buildMonthCells,
	dayKeyInTz,
} from "./calendar-helpers";
import type { CalendarItem } from "./calendar-view";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** Max colored dots rendered per day cell before extras are collapsed. */
const MAX_DOTS = 3;

export function YearView({
	items = [],
	anchor,
	timezone = "UTC",
	onSelectDay,
	onSelectMonth,
}: {
	items?: CalendarItem[];
	anchor: Date;
	timezone?: string;
	onSelectDay: (day: Date) => void;
	onSelectMonth: (month: Date) => void;
}) {
	const { t } = useTranslation("calendar");

	const itemsByDay = React.useMemo(() => {
		const map = new Map<string, CalendarItem[]>();
		for (const item of items) {
			const key = dayKeyInTz(item, timezone);
			const list = map.get(key);
			if (list) list.push(item);
			else map.set(key, [item]);
		}
		return map;
	}, [items, timezone]);

	const months = React.useMemo(
		() => Array.from({ length: 12 }, (_, i) => addMonths(startOfYear(anchor), i)),
		[anchor],
	);

	const today = new Date();

	return (
		<div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
			{months.map((month) => (
				<div key={month.toISOString()} className="rounded-lg border p-3">
					<button
						type="button"
						className="mb-2 w-full cursor-pointer rounded-md px-1 py-1 text-left text-sm font-semibold transition-colors hover:bg-accent/60"
						onClick={() => onSelectMonth(month)}
					>
						{format(month, "MMMM yyyy")}
					</button>
					<div className="grid grid-cols-7">
						{WEEKDAY_LETTERS.map((letter, i) => (
							<div
								key={`${letter}-${i}`}
								className="pb-1 text-center text-[10px] font-medium text-muted-foreground"
								aria-hidden="true"
							>
								{letter}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7 gap-y-1">
						{buildMonthCells(month).map((day) => {
							const key = format(day, "yyyy-MM-dd");
							const dayItems = itemsByDay.get(key) ?? [];
							const isToday = isSameDay(day, today);
							const isOutside = !isSameMonth(day, month);
							const dotColors = [
								...new Set(dayItems.map((item) => item.color)),
							].slice(0, MAX_DOTS);

							return (
								<button
									key={key}
									type="button"
									className={cn(
										"mx-auto flex h-9 w-full max-w-9 cursor-pointer flex-col items-center justify-start gap-0.5 rounded-md transition-colors hover:bg-accent/60",
										isOutside && "opacity-40",
									)}
									aria-label={`${format(day, "EEEE, MMMM d, yyyy")}${
										dayItems.length
											? `, ${
													dayItems.length === 1
														? t("year.itemOne", "1 item")
														: t("year.itemOther", "{{n}} items", {
																n: dayItems.length,
															})
												}`
											: ""
									}`}
									onClick={() => onSelectDay(day)}
								>
									<span
										className={cn(
											"flex size-5 items-center justify-center text-xs font-medium",
											isToday && "rounded-full bg-primary text-primary-foreground",
										)}
									>
										{format(day, "d")}
									</span>
									<span className="flex h-1.5 items-center gap-0.5">
										{dotColors.map((color) => (
											<span
												key={color}
												className={cn(
													"size-1.5 rounded-full",
													CALENDAR_COLORS[color],
												)}
												aria-hidden="true"
												/>
										))}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
