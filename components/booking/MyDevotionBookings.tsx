"use client";

import { useState, useTransition } from "react";
import { CalendarCheck2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
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
import { listRowClass } from "@/components/list-row";
import { useTranslation, Trans } from "react-i18next";

interface MyDevotionBookingsProps {
	bookings: SlotData[];
	type: BookableType;
	meetingUrl: string | null;
	slotNoun: string;
}

export function MyDevotionBookings({ bookings, type, meetingUrl, slotNoun }: MyDevotionBookingsProps) {
	const { t, i18n } = useTranslation("booking");
	const { t: tc } = useTranslation("common");
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
				toast.success(t("toast.cancelled"));
			} else {
				toast.error(result.error || t("toast.cancelFailed"));
			}
		});
	};

	if (bookings.length === 0) {
		return (
			<EmptyState
				icon={CalendarCheck2}
				title={t("agenda.emptyTitle")}
				description={t("agenda.emptyDescription")}
				actionLabel={t("agenda.emptyAction")}
				actionHref={`/booking?type=${type}`}
				className="py-2 sm:py-8"
			/>
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
								listRowClass,
								"flex items-center justify-between gap-3 border-l-4 p-2 sm:p-4 shadow-2xs transition-all",
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
										{t("action.join")}
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
										{tc("action.cancel")}
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
						<AlertDialogTitle>{t("cancel.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							<Trans
								i18nKey="cancel.descriptionSlot"
								ns="booking"
								values={{
									noun: slotNoun,
									date: toCancel?.date
										? new Date(`${toCancel.date}T00:00:00Z`).toLocaleDateString(i18n.language, {
												weekday: "short",
												month: "short",
												day: "numeric",
												timeZone: "UTC",
											})
										: t("cancel.noDate"),
									start: convertUtcTimeToLocal(toCancel?.startTime ?? ""),
									end: convertUtcTimeToLocal(toCancel?.endTime ?? ""),
								}}
								components={{ hl: <span className="font-medium text-foreground" /> }}
							/>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
						>
							{t("action.keepBooking")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleCancel();
							}}
							className={cn(buttonVariants({ variant: "destructive" }), "cursor-pointer")}
						>
							{t("action.cancelBooking")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}