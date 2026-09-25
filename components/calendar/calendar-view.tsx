"use client";

import {
	addDays,
	addMonths,
	addYears,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
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
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CalendarDetailPopover } from "./calendar-detail-popover";
import { CalendarEmptyState } from "./calendar-empty-state";
import {
	CALENDAR_COLORS,
	buildMonthCells,
	isCalendarViewMode,
	type CalendarViewMode,
} from "./calendar-helpers";
import { EventFormDialog } from "./event-form-dialog";
import { TimeGrid, weekDays } from "./time-grid";
import { YearView } from "./year-view";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type CalendarItemSource = "slot" | "event";

export type CalendarItemColor = "purple" | "red" | "amber" | "blue" | "violet";

export interface CalendarItem {
	id: string;
	source: CalendarItemSource;
	type: "BIBLE" | "PRAYER" | "PRAISE_WORSHIP" | "SPECIAL";
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
	rawEventId?: string;
	rawDate?: string;
	rawTime?: string;
	blockTypes?: string[];
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                   */
/* -------------------------------------------------------------------------- */

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
	{
		id: "SPECIAL",
		label: "Special Events",
		color: "bg-violet-500",
		iconColor: "text-violet-500",
		icon: CalendarDays,
	},
] as const;

const FILTER_DEFAULT_ON = new Set<string>(
	CALENDAR_FILTERS.map((f) => f.id),
);

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

/** An item is visible if any active filter matches it (events match "EVENTS", slots match their type). */
function matchesActiveFilters(
	item: CalendarItem,
	activeFilters: Set<string>,
): boolean {
	for (const filter of CALENDAR_FILTERS) {
		if (!activeFilters.has(filter.id)) continue;
		if (filter.id === "EVENTS") {
			if (item.source === "event" && item.type !== "SPECIAL") return true;
		} else if (filter.id === "SPECIAL") {
			if (item.type === "SPECIAL") return true;
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
	canManage,
	onEdit,
	onDelete,
	onSelect,
}: {
	day: Date;
	month: Date;
	selected: Date;
	events: CalendarItem[];
	timezone: string;
	canManage?: boolean;
	onEdit?: (item: CalendarItem) => void;
	onDelete?: (item: CalendarItem) => void;
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
							canManage={canManage}
							onEdit={onEdit}
							onDelete={onDelete}
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
	initialView = "month",
	initialDate,
	canCreate = false,
	canManage = false,
	className,
}: {
	items?: CalendarItem[];
	userTimezone?: string;
	initialView?: CalendarViewMode;
	initialDate?: string;
	canCreate?: boolean;
	canManage?: boolean;
	className?: string;
}) {
	const { t } = useTranslation("calendar");
	const { t: tc } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const legacyMonth = searchParams.get("month");
	const viewParam = searchParams.get("view");
	const dateParam = searchParams.get("date");

	// Active view: explicit ?view= wins; legacy ?month= implies month view.
	const view: CalendarViewMode = isCalendarViewMode(viewParam)
		? viewParam
		: legacyMonth
			? "month"
			: initialView;

	// Anchor date for the whole view (single source of truth: ?date=).
	const anchorDate = React.useMemo(() => {
		const parseDay = (value: string) => {
			const [y, m, d] = value.split("-").map(Number);
			return new Date(y, (m || 1) - 1, d || 1);
		};
		if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
			return parseDay(dateParam);
		}
		if (legacyMonth && /^\d{4}-\d{2}$/.test(legacyMonth)) {
			const [y, m] = legacyMonth.split("-").map(Number);
			return new Date(y, m - 1, 1);
		}
		if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
			return parseDay(initialDate);
		}
		return new Date();
	}, [dateParam, legacyMonth, initialDate]);

	const visibleMonth = React.useMemo(() => startOfMonth(anchorDate), [anchorDate]);

	const [selectedDate, setSelectedDate] = React.useState<Date>(
		() => new Date(anchorDate),
	);

	// Follow the URL when it changes (nav buttons, sidebar, back/forward) —
	// render-phase adjustment instead of an effect (no cascading render).
	const [prevAnchor, setPrevAnchor] = React.useState<Date>(anchorDate);
	if (!Object.is(prevAnchor, anchorDate)) {
		setPrevAnchor(anchorDate);
		setSelectedDate(new Date(anchorDate));
	}
	const [query, setQuery] = React.useState("");
	const [activeFilters, setActiveFilters] =
		React.useState<Set<string>>(FILTER_DEFAULT_ON);
	const [sidebarOpen, setSidebarOpen] = React.useState(false);
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
	const [editingEvent, setEditingEvent] = React.useState<CalendarItem | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const handleEdit = React.useCallback((item: CalendarItem) => {
		setEditingEvent(item);
		setIsEditOpen(true);
	}, []);

	const handleDelete = React.useCallback(
		async (item: CalendarItem) => {
			const eventId = item.rawEventId;
			if (!eventId) {
				toast.error("Missing event ID");
				return;
			}
			try {
				const res = await fetch(`/api/v1/events/${eventId}`, {
					method: "DELETE",
				});
				const json = await res.json();
				if (json.success) {
					toast.success("Event deleted");
					router.refresh();
				} else {
					toast.error(
						typeof json.error === "string"
							? json.error
							: "Could not delete event",
					);
				}
			} catch {
				toast.error("Could not delete event");
			}
		},
		[router],
	);

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

	// Days fed to the week/day time grids (memoized for TimeGrid's inner memo).
	const week = React.useMemo(() => weekDays(anchorDate), [anchorDate]);
	const dayCol = React.useMemo(() => [anchorDate], [anchorDate]);

	const pushUrl = (nextView: CalendarViewMode, nextDate: Date) => {
		router.push(
			`${pathname}?view=${nextView}&date=${format(nextDate, "yyyy-MM-dd")}`,
			{ scroll: false },
		);
	};

	// Prev/next steps one year, month, week, or day depending on the active view.
	const stepDate = (direction: 1 | -1): Date => {
		if (view === "year") return addYears(anchorDate, direction);
		if (view === "month") return addMonths(anchorDate, direction);
		if (view === "week") return addDays(anchorDate, 7 * direction);
		return addDays(anchorDate, direction);
	};

	const viewTitle =
		view === "year"
			? format(anchorDate, "yyyy")
			: view === "week"
				? `${format(startOfWeek(anchorDate), "MMM d")} – ${format(
						endOfWeek(anchorDate),
						"MMM d, yyyy",
					)}`
				: view === "day"
					? format(anchorDate, "EEEE, MMMM d, yyyy")
					: format(visibleMonth, "MMMM yyyy");

	const goToPrev = () => {
		const next = stepDate(-1);
		pushUrl(view, next);
		setSelectedDate(next);
	};
	const goToNext = () => {
		const next = stepDate(1);
		pushUrl(view, next);
		setSelectedDate(next);
	};
	const goToToday = () => {
		const now = new Date();
		pushUrl(view, now);
		setSelectedDate(now);
	};
	const switchView = (next: string) => {
		if (!next || next === view) return;
		pushUrl(next as CalendarViewMode, selectedDate);
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
						<div className="p-2 sm:p-6 border-b">
{canCreate && (
							<Button
								className="w-full"
								onClick={() => setCreateDialogOpen(true)}
							>
								<Plus className="size-4" aria-hidden="true" />
								{t("action.addEvent", "Add New Event")}
							</Button>
						)}
						</div>
						<div className="flex justify-center">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={(d) => {
									if (d) {
										setSelectedDate(d);
										pushUrl(view, d);
									}
								}}
								className="w-full"
							/>
						</div>
						<Separator />
						<div className="flex-1 p-2 sm:p-4">
							<div className="space-y-4">
								<Collapsible defaultOpen className="group/collapsible">
									<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-accent hover:text-accent-foreground">
										<span className="text-sm font-medium">{t("sidebar.calendars", "Calendars")}</span>
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
																	<span className="truncate">
																		{t(`type.${item.id}`, t(`filter.${item.id.toLowerCase()}`, item.label))}
																	</span>
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
					<div className="flex flex-col gap-4 border-b p-2 sm:p-6 md:flex-row md:items-center md:justify-between">
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
									onClick={goToPrev}
									aria-label={`${t("nav.previous", "Previous")} ${t(`view.${view}`, view)}`}
								>
									&lt;
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
									onClick={goToNext}
									aria-label={`${t("nav.next", "Next")} ${t(`view.${view}`, view)}`}
								>
									&gt;
								</Button>
								<Button variant="outline" size="sm" onClick={goToToday}>
									{tc("time.today", "Today")}
								</Button>
							</div>
							<h1 className="text-2xl">{viewTitle}</h1>
						</div>
						<div className="flex flex-col gap-3 md:flex-row md:items-center">
							<ToggleGroup
								type="single"
								variant="outline"
								size="sm"
								value={view}
								onValueChange={switchView}
								aria-label={t("switcher.label", "Calendar view")}
							>
								{(["year", "month", "week", "day"] as const).map((mode) => (
									<ToggleGroupItem
										key={mode}
										value={mode}
										aria-label={t(`view.${mode}`, mode)}
									>
										{t(`view.${mode}`, mode)}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									className="w-64 pl-10"
									placeholder={t("search.placeholder", "Search events...")}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{items.length === 0 ? (
						<CalendarEmptyState
							onCreateEvent={() => setCreateDialogOpen(true)}
							canCreate={canCreate}
						/>
					) : view === "year" ? (
						<YearView
							items={filteredEvents}
							anchor={anchorDate}
							timezone={userTimezone}
							onSelectDay={(day) => {
								setSelectedDate(day);
								pushUrl("day", day);
							}}
							onSelectMonth={(month) => {
								const first = startOfMonth(month);
								setSelectedDate(first);
								pushUrl("month", first);
							}}
						/>
					) : view === "week" ? (
						<TimeGrid
							days={week}
							items={filteredEvents}
							timezone={userTimezone}
							canManage={canManage}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onSelectDay={(day) => {
								setSelectedDate(day);
								pushUrl("day", day);
							}}
						/>
					) : view === "day" ? (
						<TimeGrid
							days={dayCol}
							items={filteredEvents}
							timezone={userTimezone}
							canManage={canManage}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					) : (
						<div className="flex-1 bg-background">
							<div className="grid grid-cols-7 border-b">
								{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
									(day, i) => (
										<div
											key={day}
											className={cn(
												"border-r p-2 sm:p-4 text-center text-sm font-medium text-muted-foreground last:border-r-0",
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
										canManage={canManage}
										onEdit={handleEdit}
										onDelete={handleDelete}
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
			<EventFormDialog
				open={isEditOpen}
				onOpenChange={(open) => {
					setIsEditOpen(open);
					if (!open) setEditingEvent(null);
				}}
				mode="edit"
				event={editingEvent}
			/>
		</div>
	);
}