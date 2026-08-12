import { Church, Clock, Flame, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrayerPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Sessions This Month"
					value="0"
					icon={Church}
					className="border-l-4 border-l-red-500"
				/>
				<StatCard
					title="Total Prayer Time"
					value="0h"
					icon={Timer}
					className="border-l-4 border-l-orange-500"
				/>
				<StatCard
					title="Consistency Rate"
					value="0%"
					icon={Flame}
					className="border-l-4 border-l-green-500"
				/>
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Church className="size-5" />
							Today&apos;s Prayer Schedule
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No prayer sessions scheduled.
						</p>
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
						<p className="text-sm text-muted-foreground">
							No Zoom links available.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
