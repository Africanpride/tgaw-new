import { Shield } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const role = (session.user.role as string) || "member";
	if (!["moderator", "admin"].includes(role)) redirect("/unauthorized");

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Shield className="size-6" />
				<h2 className="text-2xl">Admin Portal</h2>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Total Members"
					value="—"
					className="border-l-4 border-l-blue-500"
				/>
				<StatCard
					title="Published Announcements"
					value="0"
					className="border-l-4 border-l-green-500"
				/>
				<StatCard
					title="Flagged Content"
					value="0"
					className="border-l-4 border-l-red-500"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Broadcast Message</CardTitle>
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
