"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheck2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlotData } from "./SlotCell";
import { convertUtcTimeToLocal, isCurrentSlot, isPastSlot } from "./slotTime";
import { slotAccent } from "./slotAccent";
import type { BookableType } from "@/lib/services/slotService";
import { cancelSlotAction } from "@/actions/slotActions";
import { cn } from "@/lib/utils";

interface MyDevotionBookingsProps {
	bookings: SlotData[];
	type: BookableType;
	meetingUrl: string | null;
	slotNoun: string;
}

export function MyDevotionBookings({ bookings, type, meetingUrl, slotNoun }: MyDevotionBookingsProps) {
	const accent = slotAccent[type];
	const [pending, startTransition] = useTransition();
	const [toCancel, setToCancel] = useState<SlotData | null>(null);

	const handleCancel = () => {
		if (!toCancel) return;
		const slotId = toCancel.id;
		setToCancel(null);
		startTransition(async () => {
			const result = await cancelSlotAction({ slotId });
			if (result.success) {
				toast.success("Booking cancelled");
			} else {
				toast.error(result.error || "Failed to cancel booking");
			}
		});
	};

	if (bookings.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
				<div className={cn("flex size-10 items-center justify-center rounded-full", accent.iconTile)}>
					<CalendarCheck2 className="size-5" aria-hidden="true" />
				</div>
				<p className="text-sm font-medium">Nothing booked yet</p>
				<p className="max-w-[26ch] text-sm text-muted-foreground">
					Claim a quiet window and keep the watch going.
				</p>
				<Button variant="outline" size="sm" asChild className="mt-1 cursor-pointer">
					<Link href={`/booking?type=${type}`}>Book a slot</Link>
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-3">
				{bookings.map((booking) => {
					const live = isCurrentSlot(booking);
					const done = isPastSlot(booking) && !live;

					return (
						<div
							key={booking.id}
							className={cn(
								"flex items-center justify-between gap-3 rounded-lg border border-l-4 p-4 shadow-2xs transition-all",
								accent.rail,
								live ? cn(accent.mine, "ring-1 ring-inset") : accent.mine,
								done && "opacity-60",
							)}
						>
							<div className="min-w-0">
								<p
									className={cn(
										"flex items-center gap-1.5 text-sm font-semibold tabular-nums",
										accent.text,
									)}
								>
									{convertUtcTimeToLocal(booking.startTime)} –{" "}
									{convertUtcTimeToLocal(booking.endTime)}
									{live && (
										<span className="relative flex size-2">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
											<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
										</span>
									)}
									{booking.notes && !done && (
										<span className="truncate font-normal text-muted-foreground">
											· {booking.notes}
										</span>
									)}
								</p>
							</div>

							<div className="flex shrink-0 items-center gap-1.5">
								{live && meetingUrl && (
									<Button size="sm" className="h-8" asChild>
										<a href={meetingUrl} target="_blank" rel="noreferrer">
											<ExternalLink className="size-3.5" aria-hidden="true" />
											Join
										</a>
									</Button>
								)}
								{!done && !pending && (
									<Button
										variant="outline"
										size="sm"
										className="h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={() => setToCancel(booking)}
									>
										<X className="size-3.5" aria-hidden="true" />
										Cancel
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<AlertDialog open={!!toCancel} onOpenChange={(open) => !open && setToCancel(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
						<AlertDialogDescription>
							Your {slotNoun} booking on{" "}
							<span className="font-medium text-foreground">
								{toCancel?.date
									? new Date(`${toCancel.date}T00:00:00Z`).toLocaleDateString("en-US", {
											weekday: "short",
											month: "short",
											day: "numeric",
											timeZone: "UTC",
										})
									: "the selected day"}
								, {convertUtcTimeToLocal(toCancel?.startTime ?? "")} –{" "}
								{convertUtcTimeToLocal(toCancel?.endTime ?? "")}
							</span>{" "}
							will be released for another member. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
						>
							Keep booking
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleCancel();
							}}
							className={cn(buttonVariants({ variant: "destructive" }), "cursor-pointer")}
						>
							Cancel booking
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
