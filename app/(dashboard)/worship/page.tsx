import { Church, Clock, Flame, Timer, Music } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotBookingStrip } from "@/components/booking/SlotBookingStrip";
import { getSlotsForDate } from "@/lib/services/slotService";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function WorshipPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	const todayStr = format(new Date(), "yyyy-MM-dd");
	
	const { slots, meetingLinks } = await getSlotsForDate(
		todayStr, 
		"PRAISE_WORSHIP", 
		session?.user?.id, 
		session?.user?.role as string
	);
	
	const meetingLink = meetingLinks["PRAISE_WORSHIP"];
	const myBookings = slots.filter(s => s.isOwnBooking);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Sessions This Month"
					value="0"
					icon={Music}
					className="border-l-4 border-l-amber-500"
				/>
				<StatCard
					title="Total Worship Time"
					value="0h"
					icon={Timer}
					className="border-l-4 border-l-orange-500"
				/>
				<StatCard
					title="Consistency Rate"
					value="0%"
					icon={Flame}
					className="border-l-4 border-l-yellow-500"
				/>
			</div>
			
			<Card className="border-amber-500/20 shadow-md">
				<CardContent className="p-6">
					<SlotBookingStrip slots={slots} type="PRAISE_WORSHIP" />
				</CardContent>
			</Card>
			
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Music className="size-5 text-amber-500" />
							Your Upcoming Slots
						</CardTitle>
					</CardHeader>
					<CardContent>
						{myBookings.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No worship sessions scheduled for today.
							</p>
						) : (
							<div className="space-y-3">
								{myBookings.slice(0, 3).map(booking => (
									<div key={booking.id} className="p-3 border rounded-md">
										<p className="font-medium text-amber-600 dark:text-amber-400">{booking.startTime} - {booking.endTime}</p>
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
								<p className="font-medium">{meetingLink.label || "Worship Room"}</p>
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
