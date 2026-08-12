import { BookOpen, CalendarDays, Clock, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BiblePage() {
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
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpen className="size-5" />
							Today&apos;s Reading Sessions
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No reading sessions scheduled.
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
