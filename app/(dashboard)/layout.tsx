import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const role = (session.user.role as string) || "member";

	return (
		<SidebarProvider>
			<AppSidebar role={role} />
			<div className="flex flex-1 flex-col">
				<Topbar />
				<main className="flex-1 p-4 lg:p-6">{children}</main>
			</div>
		</SidebarProvider>
	);
}
