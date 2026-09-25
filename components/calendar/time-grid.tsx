"use client";

import { addDays, format, isSameDay } from "date-fns";
import { Clock } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarDetailPopover } from "./calendar-detail-popover";
import { CALENDAR_COLORS, dayKeyInTz, itemMinutes } from "./calendar-helpers";
import type { CalendarItem } from "./calendar-view";

const HOUR_PX = 48;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Greedy lane packing for overlapping items in one day. Returns lane index per item (input order preserved by caller). */
function assignLanes(sorted: { start: number; end: number }[]): number[] {
	const laneEnds: number[] = [];
	return sorted.map((item) => {
		let lane = laneEnds.findIndex((end) => end <= item.start);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(item.end);
		} else {
			laneEnds[lane] = item.end;
		}
		return lane;
	});
}

export function TimeGrid({
	days,
	items = [],
	timezone = "UTC",
	canManage,
	onEdit,
	onDelete,
	onSelectDay,
}: {
	days: Date[];
	items?: CalendarItem[];
	timezone?: string;
	canManage?: boolean;
	onEdit?: (item: CalendarItem) => void;
	onDelete?: (item: CalendarItem) => void;
	onSelectDay?: (day: Date) => void;
}) {
	const dayCols = React.useMemo(() => {
		const today = new Date();
		return days.map((day) => {
			const key = format(day, "yyyy-MM-dd");
			const dayItems = items
				.filter((item) => dayKeyInTz(item, timezone) === key)
				.map((item) => ({ item, ...itemMinutes(item) }));
			dayItems.sort((a, b) => a.start - b.start);
			const lanes = assignLanes(dayItems.map(({ start, end }) => ({ start, end })));
			return {
				day,
				key,
				isToday: isSameDay(day, today),
				entries: dayItems.map((entry, i) => ({ ...entry, lane: lanes[i] })),
				laneCount: Math.max(lanes.length, 1),
			};
		});
	}, [days, items, timezone]);

	return (
		<div className="overflow-x-auto">
			<div
				className="grid"
				style={{
					gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(3.5rem, 1fr))`,
				}}
			>
				{/* Corner (sticky both axes) */}
				<div className="sticky top-0 left-0 z-40 h-12 border-b border-r bg-background" />

				{/* Day headers (sticky top) */}
				{dayCols.map((col) => (
					<button
						key={col.key}
						type="button"
						disabled={!onSelectDay}
						className={cn(
							"sticky top-0 z-30 flex h-12 flex-col items-center justify-center border-b bg-background transition-colors",
							onSelectDay && "cursor-pointer hover:bg-accent/50",
						)}
						aria-label={format(col.day, "EEEE, MMMM d, yyyy")}
						onClick={() => onSelectDay?.(col.day)}
					>
						<span className="text-[10px] font-medium text-muted-foreground uppercase">
							{WEEKDAY_NAMES[col.day.getDay()]}
						</span>
						<span
							className={cn(
								"flex items-center justify-center text-sm font-semibold",
								col.isToday &&
									"size-6 rounded-full bg-primary text-primary-foreground",
							)}
						>
							{format(col.day, "d")}
						</span>
					</button>
				))}

				{/* Hour gutter (sticky left) */}
				<div className="sticky left-0 z-20 bg-background">
					{HOURS.map((h) => (
						<div
							key={h}
							className="flex h-12 items-start justify-end border-b border-r pr-1.5 pt-1 text-[10px] leading-none text-muted-foreground"
						>
							{`${String(h).padStart(2, "0")}:00`}
						</div>
					))}
				</div>

				{/* Day columns */}
				{dayCols.map((col) => (
					<div
						key={col.key}
						className="relative border-r last:border-r-0"
					>
						{HOURS.map((h) => (
							<div key={h} className="h-12 border-b border-border/60" />
						))}

						{col.isToday && (
							<div
								className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary"
								style={{
									top: (() => {
										const now = new Date();
										return (
											((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX
										);
									})(),
								}}
								aria-hidden="true"
							/>
						)}

						{col.entries.map(({ item, start, end, lane }) => (
							<div
								key={item.id}
								className="absolute z-10 px-0.5"
								style={{
									top: (start / 60) * HOUR_PX + 1,
									height: Math.max(((end - start) / 60) * HOUR_PX - 2, 22),
									left: `calc(${(lane / col.laneCount) * 100}% + 1px)`,
									width: `calc(${100 / col.laneCount}% - 3px)`,
								}}
							>
								<CalendarDetailPopover
									item={item}
									timezone={timezone}
									canManage={canManage}
									onEdit={onEdit}
									onDelete={onDelete}
								>
									<button
										type="button"
										className={cn(
											"flex h-full w-full cursor-pointer items-start gap-1 overflow-hidden rounded-sm px-1 py-0.5 text-left text-xs text-white",
											CALENDAR_COLORS[item.color],
										)}
										aria-label={`${item.title}, ${item.startTime}${
											item.endTime ? `–${item.endTime}` : ""
										}`}
									>
										<Clock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
										<span className="min-w-0 truncate">{item.title}</span>
									</button>
								</CalendarDetailPopover>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

/** Week = 7 day-keys (Sunday-first) built from an anchor date. */
export function weekDays(anchor: Date): Date[] {
	return Array.from({ length: 7 }, (_, i) => addDays(anchor, -anchor.getDay() + i));
}
