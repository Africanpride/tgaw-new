import { CalendarCheck, Flag, Megaphone, Shield } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Statistics from "@/components/shadcn-space/blocks/statistics-01/statistics";

export default async function AdminPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const role = (session.user.role as string) || "member";
	if (!["moderator", "admin"].includes(role)) redirect("/unauthorized");

	const [totalMembers, totalPosts, totalMessages, openReports, totalBookings] =
		await Promise.all([
			prisma.user.count(),
			prisma.post.count(),
			prisma.message.count(),
			prisma.report.count({ where: { status: "OPEN" } }),
			prisma.eventBooking.count({ where: { status: "CONFIRMED" } }),
		]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Shield className="size-6" />
				<h2 className="text-2xl">Admin Portal</h2>
			</div>

			<Statistics
				mainDashboard={{
					title: "Community Overview",
					description: "Key metrics across the platform",
					metrics: [
						{
							label: "Total Members",
							value: String(totalMembers),
							percentage: "",
							isPositive: true,
						},
						{
							label: "Published Posts",
							value: String(totalPosts),
							percentage: "",
							isPositive: true,
						},
						{
							label: "Messages Sent",
							value: String(totalMessages),
							percentage: "",
							isPositive: true,
						},
					],
				}}
				secondaryStats={[
					{
						title: "Open Reports",
						value: String(openReports),
						percentage: "",
						icon: Flag,
						isPositive: openReports === 0,
					},
					{
						title: "Active Bookings",
						value: String(totalBookings),
						percentage: "",
						icon: CalendarCheck,
						isPositive: true,
					},
				]}
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Total Members"
					value={totalMembers}
					icon={Shield}
					className="border-l-4 border-l-blue-500"
				/>
				<StatCard
					title="Published Announcements"
					value={totalPosts}
					icon={Megaphone}
					className="border-l-4 border-l-green-500"
				/>
				<StatCard
					title="Flagged Content"
					value={openReports}
					icon={Flag}
					className="border-l-4 border-l-red-500"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Megaphone className="size-5" />
						Broadcast Message
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Send a global announcement to all community members.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
