"use client";

import {
	addDays,
	addMonths,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
} from "date-fns";
import {
	CalendarDays,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Ellipsis,
	Eye,
	Grid2x2,
	Menu,
	Plus,
	Search,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
	id: string;
	title: string;
	color: "blue" | "green" | "purple" | "orange" | "pink";
	date: Date;
}

const CALENDAR_COLORS: Record<CalendarEvent["color"], string> = {
	blue: "bg-blue-500",
	green: "bg-green-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	pink: "bg-pink-500",
};

const CALENDAR_LISTS = [
	{ id: "personal", label: "Personal", color: "bg-blue-500" },
	{ id: "work", label: "Work", color: "bg-green-500" },
	{ id: "family", label: "Family", color: "bg-pink-500" },
] as const;

function buildMonthCells(month: Date) {
	const first = startOfMonth(month);
	const start = addDays(first, -first.getDay());
	return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function DayCell({
	day,
	month,
	selected,
	events,
	onSelect,
}: {
	day: Date;
	month: Date;
	selected: Date;
	events: CalendarEvent[];
	onSelect: (day: Date) => void;
}) {
	const dayEvents = events.filter((e) => isSameDay(e.date, day));
	const isToday = isSameDay(day, new Date());
	const isOutside = !isSameMonth(day, month);
	const isSelected = isSameDay(day, selected);

	return (
		<button
			type="button"
			className={cn(
				"min-h-[120px] cursor-pointer border-b border-r p-2 text-left transition-colors last:border-r-0",
				isOutside && "bg-muted/30 text-muted-foreground",
				!isOutside && "bg-background hover:bg-accent/50",
				isSelected && "bg-accent/20",
			)}
			onClick={() => onSelect(day)}
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
				{dayEvents.map((event) => (
					<div
						key={event.id}
						className={cn(
							"flex cursor-pointer items-center gap-1 truncate rounded-sm p-1 text-xs text-white",
							CALENDAR_COLORS[event.color],
						)}
					>
						<Clock className="size-3 shrink-0" aria-hidden="true" />
						<span className="truncate">{event.title}</span>
					</div>
				))}
			</div>
		</button>
	);
}

export function CalendarView({
	events = [],
	className,
}: {
	events?: CalendarEvent[];
	className?: string;
}) {
	const [visibleMonth, setVisibleMonth] = React.useState(new Date());
	const [selectedDate, setSelectedDate] = React.useState(new Date());
	const [query, setQuery] = React.useState("");

	const monthCells = React.useMemo(
		() => buildMonthCells(visibleMonth),
		[visibleMonth],
	);
	const filteredEvents = React.useMemo(() => {
		if (!query.trim()) return events;
		return events.filter((e) =>
			e.title.toLowerCase().includes(query.trim().toLowerCase()),
		);
	}, [events, query]);

	const goToPrevMonth = () => setVisibleMonth((m) => addMonths(m, -1));
	const goToNextMonth = () => setVisibleMonth((m) => addMonths(m, 1));
	const goToToday = () => {
		setVisibleMonth(new Date());
		setSelectedDate(new Date());
	};

	return (
		<div className={cn("border rounded-lg bg-background relative", className)}>
			<div className="flex min-h-[800px]">
				<div className="hidden xl:block w-80 flex-shrink-0 border-r">
					<div className="flex h-full flex-col rounded-lg bg-background">
						<div className="p-6 border-b">
							<Button className="w-full">
								<Plus aria-hidden="true" />
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
										setVisibleMonth(d);
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
										<span className="text-sm font-medium">My Calendars</span>
										<div className="flex items-center gap-1">
											<div className="flex size-5 cursor-pointer items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-accent group-hover/collapsible:opacity-100">
												<Plus className="size-3" aria-hidden="true" />
											</div>
											<ChevronRight
												className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
												aria-hidden="true"
											/>
										</div>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="mt-2 space-y-1">
											{CALENDAR_LISTS.map((item) => (
												<div key={item.id} className="group/calendar-item">
													<div className="flex items-center justify-between rounded-md p-2 hover:bg-accent/50">
														<div className="flex flex-1 items-center gap-3">
															<button
																type="button"
																className={cn(
																	"flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent text-white",
																	item.color,
																)}
																aria-label={`Toggle ${item.label} calendar`}
															>
																<Check className="size-3" aria-hidden="true" />
															</button>
															<span className="flex-1 cursor-pointer truncate text-sm">
																{item.label}
															</span>
															<div className="opacity-0 transition-opacity group-hover/calendar-item:opacity-100">
																<Eye
																	className="size-3 text-muted-foreground"
																	aria-hidden="true"
																/>
															</div>
															<DropdownMenu>
																<DropdownMenuTrigger
																	className="flex size-5 cursor-pointer items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-accent group-hover/calendar-item:opacity-100"
																	aria-label={`${item.label} calendar options`}
																>
																	<Ellipsis
																		className="size-3"
																		aria-hidden="true"
																	/>
																</DropdownMenuTrigger>
																<DropdownMenuContent>
																	<DropdownMenuItem>Rename</DropdownMenuItem>
																	<DropdownMenuItem>Settings</DropdownMenuItem>
																	<DropdownMenuItem>Delete</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</div>
												</div>
											))}
										</div>
									</CollapsibleContent>
								</Collapsible>
								<Collapsible className="group/collapsible">
									<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-accent hover:text-accent-foreground">
										<span className="text-sm font-medium">Favorites</span>
										<ChevronRight
											className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
											aria-hidden="true"
										/>
									</CollapsibleTrigger>
									<CollapsibleContent />
								</Collapsible>
								<Collapsible className="group/collapsible">
									<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-accent hover:text-accent-foreground">
										<span className="text-sm font-medium">Other</span>
										<ChevronRight
											className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
											aria-hidden="true"
										/>
									</CollapsibleTrigger>
									<CollapsibleContent />
								</Collapsible>
							</div>
						</div>
						<div className="border-t p-4">
							<Button variant="outline" className="w-full justify-start">
								<Plus aria-hidden="true" />
								New Calendar
							</Button>
						</div>
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-4">
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 xl:hidden"
								aria-label="Toggle calendar sidebar"
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
									<ChevronLeft aria-hidden="true" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
									onClick={goToNextMonth}
									aria-label="Next month"
								>
									<ChevronRight aria-hidden="true" />
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
							<DropdownMenu>
								<DropdownMenuTrigger
									render={<Button variant="outline" className="gap-1.5" />}
								>
									<Grid2x2 aria-hidden="true" />
									Month
									<ChevronDown aria-hidden="true" />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>
										<CalendarDays aria-hidden="true" />
										Month
									</DropdownMenuItem>
									<DropdownMenuItem disabled>Week</DropdownMenuItem>
									<DropdownMenuItem disabled>Day</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
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
									onSelect={setSelectedDate}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
