"use client";

import { Bell, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { TopbarUserMenu } from "@/components/dashboard/TopbarUserMenu";
import { useTheme } from "@/components/theme-provider";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageTitles: Record<string, string> = {
	"/overview": "Dashboard",
	"/calendar": "Calendar",
	"/bible": "Bible Reading",
	"/prayer": "Prayer",
	"/worship": "Praise & Worship",
	"/booking": "Slot Booking",
	"/feed": "Community Feed",
	"/messages": "Messages",
	"/groups": "Groups",
	"/settings": "Settings",
	"/notifications": "Notifications",
	"/admin": "Admin Portal",
	"/admin/reports": "Moderation Queue",
	"/admin/users": "User Management",
};

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
	"/overview": [{ label: "Dashboard" }],
	"/calendar": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Calendar" },
	],
	"/bible": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Bible Reading" },
	],
	"/prayer": [{ label: "Dashboard", href: "/overview" }, { label: "Prayer" }],
	"/worship": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Praise & Worship" },
	],
	"/booking": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Slot Booking" },
	],
	"/feed": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Community", href: "/feed" },
		{ label: "Feed" },
	],
	"/messages": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Community", href: "/feed" },
		{ label: "Messages" },
	],
	"/groups": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Community", href: "/feed" },
		{ label: "Groups" },
	],
	"/settings": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Account" },
		{ label: "Settings" },
	],
	"/notifications": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Account" },
		{ label: "Notifications" },
	],
	"/admin": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Admin" },
		{ label: "Admin Portal" },
	],
	"/admin/reports": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Admin" },
		{ label: "Moderation Queue" },
	],
	"/admin/users": [
		{ label: "Dashboard", href: "/overview" },
		{ label: "Admin" },
		{ label: "User Management" },
	],
};

const themes = ["light", "dark", "system"] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function Topbar() {
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const title = pageTitles[pathname] || "Dashboard";
	const crumbs = breadcrumbMap[pathname] ?? [{ label: title }];

	const cycleTheme = () => {
		const idx = themes.indexOf((theme ?? "system") as (typeof themes)[number]);
		setTheme(themes[(idx + 1) % themes.length]);
	};

	const Icon = themeIcons[(theme ?? "system") as keyof typeof themeIcons];

	return (
		<header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
			<SidebarTrigger className="cursor-pointer shrink-0" />
			<div className="h-4 w-px shrink-0 bg-border" />
			<Breadcrumb className="min-w-0">
				<BreadcrumbList className="flex-nowrap">
					{crumbs.map((crumb, idx) => {
						const isLast = idx === crumbs.length - 1;
						return (
							<Fragment key={crumb.label}>
								<BreadcrumbItem>
									{isLast || !crumb.href ? (
										<BreadcrumbPage className="truncate">
											{crumb.label}
										</BreadcrumbPage>
									) : (
									<BreadcrumbLink
										asChild
									>
										<Link href={crumb.href} className="cursor-pointer">
											{crumb.label}
										</Link>
									</BreadcrumbLink>
									)}
								</BreadcrumbItem>
								{!isLast && crumb.href && <BreadcrumbSeparator />}
							</Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="cursor-pointer"
					onClick={cycleTheme}
					aria-label="Toggle theme"
				>
					<Icon className="size-5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					asChild
				>
					<Link href="/notifications" className="cursor-pointer">
						<Bell className="size-5" />
					</Link>
				</Button>
				<TopbarUserMenu />
			</div>
		</header>
	);
}
