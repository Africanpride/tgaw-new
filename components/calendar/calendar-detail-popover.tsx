"use client";

import { format } from "date-fns";
import {
	BookOpen,
	CalendarDays,
	Clock,
	ExternalLink,
	X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CalendarItem, CalendarItemColor } from "./calendar-view";

const COLOR_DOT: Record<CalendarItemColor, string> = {
	purple: "bg-purple-500",
	red: "bg-red-500",
	amber: "bg-amber-500",
	blue: "bg-blue-500",
	violet: "bg-violet-500",
};

const TYPE_LABEL: Record<CalendarItem["type"], string> = {
	BIBLE: "Bible Reading",
	PRAYER: "Prayer",
	PRAISE_WORSHIP: "Praise & Worship",
	SPECIAL: "Special Event",
};

function addMinutesToTime(time: string, minutes: number): string {
	const [h, m] = time.split(":").map(Number);
	const total = h * 60 + m + minutes;
	const eh = Math.floor(total / 60) % 24;
	const em = total % 60;
	return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function useIsDesktop(): boolean {
	const [isDesktop, setIsDesktop] = React.useState(true);
	React.useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const update = () => setIsDesktop(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	return isDesktop;
}

function ItemDetail({
	item,
	timezone,
	onClose,
}: {
	item: CalendarItem;
	timezone: string;
	onClose: () => void;
}) {
	const endTime =
		item.endTime ??
		(item.duration ? addMinutesToTime(item.startTime, item.duration) : null);

	return (
		<div className="space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h4 className="font-semibold leading-tight">{item.title}</h4>
					<div className="mt-1.5 flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5">
							<span
								className={cn("size-2 rounded-full", COLOR_DOT[item.color])}
								aria-hidden="true"
							/>
							{TYPE_LABEL[item.type]}
						</Badge>
						{item.source === "slot" && (
							<Badge variant="secondary">Booked</Badge>
						)}
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					aria-label="Close details"
				>
					<X className="size-4" aria-hidden="true" />
				</Button>
			</div>

			<div className="space-y-2.5 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<CalendarDays className="size-4 shrink-0" aria-hidden="true" />
					{format(new Date(item.date), "EEEE, MMMM d, yyyy")}
				</div>
				<div className="flex items-center gap-2">
					<Clock
						className="size-4 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<span>
						{item.startTime}
						{endTime ? ` – ${endTime}` : ""}
						{item.duration ? ` (${item.duration} min)` : ""}
					</span>
					<span className="text-xs text-muted-foreground">({timezone})</span>
				</div>
				{item.passage && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<BookOpen className="size-4 shrink-0" aria-hidden="true" />
						<span>{item.passage}</span>
					</div>
				)}
				{item.notes && (
					<p className="rounded-md bg-muted p-3 text-sm">{item.notes}</p>
				)}
				{item.zoomUrl && (
					<a
						href={item.zoomUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
					>
						{item.zoomLabel ?? "Join Zoom/Teams meeting"}
						<ExternalLink className="size-3.5" aria-hidden="true" />
					</a>
				)}
			</div>
		</div>
	);
}

export function CalendarDetailPopover({
	children,
	item,
	timezone,
}: {
	children: React.ReactNode;
	item: CalendarItem;
	timezone?: string;
}) {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useIsDesktop();

	const content = (
		<ItemDetail
			item={item}
			timezone={timezone ?? "UTC"}
			onClose={() => setOpen(false)}
		/>
	);

	if (!isDesktop) {
		return (
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>{children}</SheetTrigger>
				<SheetContent side="bottom" className="px-6 pb-8">
					<SheetHeader>
						<SheetTitle className="sr-only">{item.title}</SheetTitle>
					</SheetHeader>
					{content}
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="start" sideOffset={4}>
				{content}
			</PopoverContent>
		</Popover>
	);
}