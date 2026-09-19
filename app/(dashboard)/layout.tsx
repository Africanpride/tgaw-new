import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SlotSyncListener } from "@/components/booking/SlotSyncListener";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { MobileDock } from "@/components/dashboard/MobileDock";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { PresenceProvider } from "@/components/presence/PresenceProvider";
import { I18nProvider } from "@/providers/I18nProvider";
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
		<I18nProvider>
		<SidebarProvider defaultOpen={false}>
			<a href="#main-content" className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
				Skip to content
			</a>
			<PresenceProvider>
				<SlotSyncListener />
				<CommandPalette role={role} />
				<AppSidebar role={role} />
				<div className="flex min-w-0 flex-1 flex-col">
					<Topbar />
					<main id="main-content" className="flex-1 p-2 pb-20 sm:p-4 sm:pb-20 md:pb-4 lg:p-6 lg:pb-6">
						<PageTransition>{children}</PageTransition>
					</main>
				</div>
				<MobileDock />
			</PresenceProvider>
		</SidebarProvider>
		</I18nProvider>
	);
}