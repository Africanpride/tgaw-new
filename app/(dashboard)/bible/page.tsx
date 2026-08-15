import { BookOpen, CalendarDays, Clock, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotBookingStrip } from "@/components/booking/SlotBookingStrip";
import { getSlotsForDate } from "@/lib/services/slotService";
import { format, parse } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateNav } from "@/components/date-nav";

function getCurrentSlotId(slots: { id: string; startTime: string; endTime: string }[]): string | undefined {
	const now = new Date();
	const utcHH = String(now.getUTCHours()).padStart(2, "0");
	const utcMM = String(now.getUTCMinutes()).padStart(2, "0");
	const nowTime = `${utcHH}:${utcMM}`;
	return slots.find((s) => s.startTime <= nowTime && s.endTime > nowTime)?.id;
}

export default async function BiblePage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	const { date: dateParam } = await searchParams;
	const dateStr = dateParam ?? format(new Date(), "yyyy-MM-dd");

	const { slots, meetingLinks } = await getSlotsForDate(
		dateStr,
		"BIBLE",
		session?.user?.id,
		session?.user?.role as string,
	);

	const meetingLink = meetingLinks["BIBLE"];
	const myBookings = slots.filter((s) => s.isOwnBooking);
	const initialSlotId = dateParam ? undefined : getCurrentSlotId(slots);

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
								{myBookings.slice(0, 3).map((booking) => (
									<div
										key={booking.id}
										className="border rounded-md p-3"
									>
										<p className="font-medium text-purple-600 dark:text-purple-400">
											{booking.startTime} - {booking.endTime}
										</p>
										{booking.notes && (
											<p className="mt-1 text-sm text-muted-foreground">
												{booking.notes}
											</p>
										)}
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
							Zoom Meeting Links
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
