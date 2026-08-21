import { BookOpen, CalendarDays, Clock, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotBookingStrip } from "@/components/booking/SlotBookingStrip";
import { getSlotsForDate } from "@/lib/services/slotService";
import { format, parse } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateNav } from "@/components/date-nav";

import { convertUtcTimeToLocal } from "@/components/booking/slotTime";
import { slotAccent } from "@/components/booking/slotAccent";
import { cn } from "@/lib/utils";

function getCurrentSlotId(slots: { id: string; startTime: string; endTime: string }[]): string | undefined {
	const now = new Date();
	const utcHH = String(now.getUTCHours()).padStart(2, "0");
	const utcMM = String(now.getUTCMinutes()).padStart(2, "0");
	const nowTime = `${utcHH}:${utcMM}`;
	return slots.find((s) => s.startTime <= nowTime && s.endTime > nowTime)?.id;
}

export default async function BiblePage(props: {
	searchParams: Promise<{ date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const dateParam = searchParams?.date;
	const dateStr = dateParam ?? format(new Date(), "yyyy-MM-dd");

	const session = await auth.api.getSession({ headers: await headers() });

	const { slots, meetingLinks } = await getSlotsForDate(
		dateStr,
		"BIBLE",
		session?.user?.id,
		session?.user?.role as string,
	);

	const meetingLink = meetingLinks["BIBLE"];
	const myBookings = slots.filter((s) => s.isOwnBooking);
	const initialSlotId = dateParam ? undefined : getCurrentSlotId(slots);
	const accent = slotAccent["BIBLE"];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Sessions This Week"
					value="0"
					icon={CalendarDays}
					className="border-l-4 border-l-purple-500"
				/>
				<StatCard
					title="Total Reading Time"
					value="0h"
					icon={Timer}
					className="border-l-4 border-l-blue-500"
				/>
				<StatCard
					title="Chapters Completed"
					value="0"
					icon={BookOpen}
					className="border-l-4 border-l-green-500"
				/>
			</div>

			<Card className="min-w-0 w-full overflow-hidden border-purple-500/20 shadow-md">
				<CardContent className="flex items-center justify-between p-6">
					<DateNav dateStr={dateStr} basePath="/bible" />
				</CardContent>
				<CardContent className="pt-0">
					<SlotBookingStrip slots={slots} type="BIBLE" initialSlotId={initialSlotId} />
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpen className="size-5 text-purple-500" />
							Your Slots for{" "}
							{format(parse(dateStr, "yyyy-MM-dd", new Date()), "MMM d")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{myBookings.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No reading sessions scheduled for this day.
							</p>
						) : (
							<div className="space-y-3">
								{myBookings.map((booking) => (
									<div
										key={booking.id}
										className={cn(
											"flex items-center justify-between rounded-lg border border-l-4 p-4 shadow-2xs transition-all",
											accent.rail,
											accent.mine
										)}
									>
										<div>
											<p className={cn("flex items-center gap-1.5 font-semibold tabular-nums text-sm", accent.text)}>
												<Clock className="size-4 shrink-0" aria-hidden="true" />
												{convertUtcTimeToLocal(booking.startTime)} – {convertUtcTimeToLocal(booking.endTime)}
											</p>
											{booking.notes && (
												<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
													{booking.notes}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="size-5" />
							Meeting Links
						</CardTitle>
					</CardHeader>
					<CardContent>
						{meetingLink ? (
							<div className="space-y-4">
								<p className="font-medium">
									{meetingLink.label || "Bible Reading Room"}
								</p>
								<a
									href={meetingLink.url}
									target="_blank"
									rel="noreferrer"
									className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
								>
									Join Meeting
								</a>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No Zoom links available for this day.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
