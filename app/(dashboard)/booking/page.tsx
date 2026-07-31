import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingPage() {
	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="size-5" />
						Slot Booking
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center gap-4 py-12">
					<p className="text-muted-foreground">Coming Soon</p>
					<p className="text-center text-sm text-muted-foreground max-w-md">
						Book time slots for Bible reading, prayer sessions, and praise &amp;
						worship. View availability on the calendar and manage your bookings.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
