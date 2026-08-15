"use client";

import {
	addDays,
	addMonths,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	subMonths,
} from "date-fns";
import {
	BookOpen,
	CalendarDays,
	Check,
	Clock,
	HandHeart,
	Menu,
	Music,
	Plus,
	Search,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CalendarDetailPopover } from "./calendar-detail-popover";
import { CalendarEmptyState } from "./calendar-empty-state";
import { EventFormDialog } from "./event-form-dialog";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type CalendarItemSource = "slot" | "event";

export type CalendarItemColor = "purple" | "red" | "amber" | "blue";

export interface CalendarItem {
	id: string;
	source: CalendarItemSource;
	type: "BIBLE" | "PRAYER" | "PRAISE_WORSHIP";
	title: string;
	color: CalendarItemColor;
	/** ISO date string (serializable from the server component). */
	date: string;
	startTime: string;
	endTime?: string;
	duration?: number;
	notes?: string | null;
	passage?: string | null;
	zoomUrl?: string | null;
	zoomLabel?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

const CALENDAR_COLORS: Record<CalendarItemColor, string> = {
	purple: "bg-purple-500",
	red: "bg-red-500",
	amber: "bg-amber-500",
	blue: "bg-blue-500",
};

const CALENDAR_FILTERS = [
	{
		id: "BIBLE",
		label: "Bible Reading",
		color: "bg-purple-500",
		iconColor: "text-purple-500",
		icon: BookOpen,
	},
	{
		id: "PRAYER",
		label: "Prayer",
		color: "bg-red-500",
		iconColor: "text-red-500",
		icon: HandHeart,
	},
	{
		id: "PRAISE_WORSHIP",
		label: "Praise & Worship",
		color: "bg-amber-500",
		iconColor: "text-amber-500",
		icon: Music,
	},
	{
		id: "EVENTS",
		label: "My Events",
		color: "bg-blue-500",
		iconColor: "text-blue-500",
		icon: CalendarDays,
	},
] as const;

const FILTER_DEFAULT_ON = new Set<string>(
	CALENDAR_FILTERS.map((f) => f.id),
);

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function buildMonthCells(month: Date) {
	const first = startOfMonth(month);
	const start = addDays(first, -first.getDay());
	return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** An item is visible if any active filter matches it (events match "EVENTS", slots match their type). */
function matchesActiveFilters(
	item: CalendarItem,
	activeFilters: Set<string>,
): boolean {
	for (const filter of CALENDAR_FILTERS) {
		if (!activeFilters.has(filter.id)) continue;
		if (filter.id === "EVENTS") {
			if (item.source === "event") return true;
		} else if (item.source === "slot" && item.type === filter.id) {
			return true;
		}
	}
	return false;
}

/* -------------------------------------------------------------------------- */
/*                               Day Cell                                     */
/* -------------------------------------------------------------------------- */

function DayCell({
	day,
	month,
	selected,
	events,
	timezone,
	onSelect,
}: {
	day: Date;
	month: Date;
	selected: Date;
	events: CalendarItem[];
	timezone: string;
	onSelect: (day: Date) => void;
}) {
	const shouldReduceMotion = useReducedMotion();
	const dayEvents = events.filter((e) => isSameDay(new Date(e.date), day));
	const isToday = isSameDay(day, new Date());
	const isOutside = !isSameMonth(day, month);
	const isSelected = isSameDay(day, selected);

	return (
		<div
			className={cn(
				"min-h-[120px] cursor-pointer border-b border-r p-2 text-left transition-colors last:border-r-0",
				isOutside && "bg-muted/30 text-muted-foreground",
				!isOutside && "bg-background hover:bg-accent/50",
				isSelected && "bg-accent/20",
			)}
			role="button"
			tabIndex={0}
			aria-label={format(day, "EEEE, MMMM d, yyyy")}
			onClick={() => onSelect(day)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(day);
				}
			}}
		>
			<div className="mb-1 flex items-center justify-between">
				{isToday ? (
					<span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
						{format(day, "d")}
					</span>
				) : (
					<span className="text-sm font-medium">{format(day, "d")}</span>
				)}
			</div>
			<div className="space-y-1">
				{dayEvents.length === 0 && (
					<p className="py-1 text-center text-xs text-muted-foreground">
						No events
					</p>
				)}
				{dayEvents.map((item) => (
					<motion.div
						key={item.id}
						initial={
							shouldReduceMotion ? false : { opacity: 0, y: 4 }
						}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
					>
						<CalendarDetailPopover
							item={item}
							timezone={timezone}
						>
							<button
								type="button"
								className={cn(
									"flex w-full cursor-pointer items-center gap-1 truncate rounded-sm p-1 text-xs text-white",
									CALENDAR_COLORS[item.color],
								)}
							>
								<Clock className="size-3 shrink-0" aria-hidden="true" />
								<span className="truncate">{item.title}</span>
							</button>
						</CalendarDetailPopover>
					</motion.div>
				))}
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                             Calendar View                                  */
/* -------------------------------------------------------------------------- */

export function CalendarView({
	items = [],
	userTimezone = "UTC",
	initialMonth,
	className,
}: {
	items?: CalendarItem[];
	userTimezone?: string;
	initialMonth?: string;
	className?: string;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const visibleMonth = React.useMemo(() => {
		const monthParam = searchParams.get("month") ?? initialMonth;
		return monthParam
			? (() => {
					const [y, m] = monthParam.split("-").map(Number);
					return new Date(y, m - 1, 1);
				})()
			: new Date();
	}, [searchParams, initialMonth]);

	const [selectedDate, setSelectedDate] = React.useState(new Date());
	const [query, setQuery] = React.useState("");
	const [activeFilters, setActiveFilters] =
		React.useState<Set<string>>(FILTER_DEFAULT_ON);
	const [sidebarOpen, setSidebarOpen] = React.useState(false);
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

	const monthCells = React.useMemo(
		() => buildMonthCells(visibleMonth),
		[visibleMonth],
	);

	const filteredEvents = React.useMemo(() => {
		let result = items.filter((item) => matchesActiveFilters(item, activeFilters));

		if (query.trim()) {
			const q = query.trim().toLowerCase();
			result = result.filter(
				(e) =>
					e.title.toLowerCase().includes(q) ||
					e.notes?.toLowerCase().includes(q) ||
					e.passage?.toLowerCase().includes(q),
			);
		}

		return result;
	}, [items, activeFilters, query]);

	const goToPrevMonth = () => {
		const prev = subMonths(visibleMonth, 1);
		router.push(`${pathname}?month=${format(prev, "yyyy-MM")}`, {
			scroll: false,
		});
	};
	const goToNextMonth = () => {
		const next = addMonths(visibleMonth, 1);
		router.push(`${pathname}?month=${format(next, "yyyy-MM")}`, {
			scroll: false,
		});
	};
	const goToToday = () => {
		router.push(pathname, { scroll: false });
		setSelectedDate(new Date());
	};

	const toggleFilter = (id: string) => {
		setActiveFilters((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div className={cn("border rounded-lg bg-background relative", className)}>
			<div className="flex min-h-[800px]">
				{/* Sidebar */}
				<div className="hidden xl:block w-80 flex-shrink-0 border-r">
					<div className="flex h-full flex-col rounded-lg bg-background">
						<div className="p-6 border-b">
							<Button
								className="w-full"
								onClick={() => setCreateDialogOpen(true)}
							>
								<Plus className="size-4" aria-hidden="true" />
								Add New Event
							</Button>
						</div>
						<div className="flex justify-center">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={(d) => {
									if (d) {
										setSelectedDate(d);
										router.push(
											`${pathname}?month=${format(d, "yyyy-MM")}`,
											{ scroll: false },
										);
									}
								}}
								className="w-full"
							/>
						</div>
						<Separator />
						<div className="flex-1 p-4">
							<div className="space-y-4">
								<Collapsible defaultOpen className="group/collapsible">
									<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-accent hover:text-accent-foreground">
										<span className="text-sm font-medium">Calendars</span>
										<Check
											className="size-4 text-muted-foreground"
											aria-hidden="true"
										/>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="mt-2 space-y-1">
											{CALENDAR_FILTERS.map((item) => {
												const isActive = activeFilters.has(item.id);
												const Icon = item.icon;
												return (
													<div
														key={item.id}
														className="group/calendar-item"
													>
														<div className="flex items-center justify-between rounded-md p-2 hover:bg-accent/50">
															<div className="flex flex-1 items-center gap-3">
																<button
																	type="button"
																	className={cn(
																		"flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors",
																		isActive
																			? cn("border-transparent text-white", item.color)
																			: "border-muted-foreground/40 bg-transparent",
																	)}
																	onClick={() => toggleFilter(item.id)}
																	aria-label={`Toggle ${item.label} calendar`}
																	aria-pressed={isActive}
																>
																	{isActive && (
																		<Check
																			className="size-3"
																			aria-hidden="true"
																		/>
																	)}
																</button>
																<button
																	type="button"
																	className={cn(
																		"flex flex-1 cursor-pointer items-center gap-2 truncate text-sm",
																		!isActive &&
																			"line-through opacity-50",
																	)}
																	onClick={() => toggleFilter(item.id)}
																>
<Icon
										className={cn(
											"size-4 shrink-0",
											item.iconColor,
										)}
										aria-hidden="true"
									/>
																	<span className="truncate">{item.label}</span>
																</button>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</CollapsibleContent>
								</Collapsible>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="min-w-0 flex-1">
					<div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-4">
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 xl:hidden"
								aria-label="Toggle calendar sidebar"
								onClick={() => setSidebarOpen(!sidebarOpen)}
							>
								<Menu aria-hidden="true" />
							</Button>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
									onClick={goToPrevMonth}
									aria-label="Previous month"
								>
									&lt;
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
									onClick={goToNextMonth}
									aria-label="Next month"
								>
									&gt;
								</Button>
								<Button variant="outline" size="sm" onClick={goToToday}>
									Today
								</Button>
							</div>
							<h1 className="text-2xl">
								{format(visibleMonth, "MMMM yyyy")}
							</h1>
						</div>
						<div className="flex flex-col gap-3 md:flex-row md:items-center">
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									className="w-64 pl-10"
									placeholder="Search events..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{items.length === 0 ? (
						<CalendarEmptyState
							onCreateEvent={() => setCreateDialogOpen(true)}
						/>
					) : (
						<div className="flex-1 bg-background">
							<div className="grid grid-cols-7 border-b">
								{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
									(day, i) => (
										<div
											key={day}
											className={cn(
												"border-r p-4 text-center text-sm font-medium text-muted-foreground last:border-r-0",
												i === 0 && "hidden lg:block",
											)}
										>
											{day}
										</div>
									),
								)}
							</div>
							<div className="grid grid-cols-7 flex-1">
								{monthCells.map((day) => (
									<DayCell
										key={day.toISOString()}
										day={day}
										month={visibleMonth}
										selected={selectedDate}
										events={filteredEvents}
										timezone={userTimezone}
										onSelect={setSelectedDate}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			<EventFormDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>
		</div>
	);
}