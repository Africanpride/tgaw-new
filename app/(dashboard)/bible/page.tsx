import { BookOpen, CalendarDays, Clock, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotBookingStrip } from "@/components/booking/SlotBookingStrip";
import { getSlotsForDate } from "@/lib/services/slotService";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function BiblePage() {
	const session = await auth.api.getSession({ headers: await headers() });
	const todayStr = format(new Date(), "yyyy-MM-dd");
	
	const { slots, meetingLinks } = await getSlotsForDate(
		todayStr, 
		"BIBLE", 
		session?.user?.id, 
		session?.user?.role as string
	);
	
	const meetingLink = meetingLinks["BIBLE"];
	const myBookings = slots.filter(s => s.isOwnBooking);

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
			
			<Card className="border-purple-500/20 shadow-md">
				<CardContent className="p-6">
					<SlotBookingStrip slots={slots} type="BIBLE" />
				</CardContent>
			</Card>
			
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpen className="size-5 text-purple-500" />
							Your Upcoming Slots
						</CardTitle>
					</CardHeader>
					<CardContent>
						{myBookings.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No reading sessions scheduled for today.
							</p>
						) : (
							<div className="space-y-3">
								{myBookings.slice(0, 3).map(booking => (
									<div key={booking.id} className="p-3 border rounded-md">
										<p className="font-medium text-purple-600 dark:text-purple-400">{booking.startTime} - {booking.endTime}</p>
										{booking.notes && <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>}
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
								<p className="font-medium">{meetingLink.label || "Bible Reading Room"}</p>
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
								No Zoom links available for today.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
