"use client";

import { Bell, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageDialog } from "@/components/i18n/LanguageDialog";
import { NavUser } from "@/components/nav-user";
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

const themes = ["light", "dark", "system"] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function Topbar() {
	const { t } = useTranslation("dashboard");
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();

	const pageTitles: Record<string, string> = {
		"/overview": t("topbar.page.dashboard"),
		"/calendar": t("topbar.page.calendar"),
		"/bible": t("sidebar.bible"),
		"/prayer": t("sidebar.prayer"),
		"/worship": t("sidebar.worship"),
		"/booking": t("topbar.page.booking"),
		"/feed": t("sidebar.feed"),
		"/messages": t("sidebar.messages"),
		"/groups": t("sidebar.groups"),
		"/settings": t("sidebar.settings"),
		"/notifications": t("topbar.notifications"),
		"/admin": t("sidebar.admin"),
		"/admin/reports": t("topbar.page.reports"),
		"/admin/users": t("sidebar.users"),
	};

	const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
		"/overview": [{ label: t("topbar.page.dashboard") }],
		"/calendar": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.calendar") },
		],
		"/bible": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("sidebar.bible") },
		],
		"/prayer": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("sidebar.prayer") },
		],
		"/worship": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("sidebar.worship") },
		],
		"/booking": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.booking") },
		],
		"/feed": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.community"), href: "/feed" },
			{ label: t("topbar.page.feed") },
		],
		"/messages": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.community"), href: "/feed" },
			{ label: t("sidebar.messages") },
		],
		"/groups": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.community"), href: "/feed" },
			{ label: t("sidebar.groups") },
		],
		"/settings": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.account") },
			{ label: t("sidebar.settings") },
		],
		"/notifications": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.account") },
			{ label: t("topbar.notifications") },
		],
		"/admin": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.admin") },
			{ label: t("sidebar.admin") },
		],
		"/admin/reports": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.admin") },
			{ label: t("topbar.page.reports") },
		],
		"/admin/users": [
			{ label: t("topbar.page.dashboard"), href: "/overview" },
			{ label: t("topbar.page.admin") },
			{ label: t("sidebar.users") },
		],
	};

	const title = pageTitles[pathname] || t("topbar.page.dashboard");
	const crumbs = breadcrumbMap[pathname] ?? [{ label: title }];
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const cycleTheme = () => {
		const idx = themes.indexOf((theme ?? "system") as (typeof themes)[number]);
		setTheme(themes[(idx + 1) % themes.length]);
	};

	const Icon = mounted
		? themeIcons[(theme ?? "system") as keyof typeof themeIcons]
		: Monitor;

	return (
		<header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-card px-2 sm:px-4 lg:px-6">
			<SidebarTrigger className="cursor-pointer shrink-0" />
			<div className="h-4 w-px shrink-0 bg-border" />
			<div className="min-w-0 flex-1 sm:hidden">
				<span className="block truncate text-sm font-semibold">{title}</span>
			</div>
			<Breadcrumb className="hidden min-w-0 sm:flex">
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
										<BreadcrumbLink asChild>
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
			<div className="ml-auto flex shrink-0 items-center gap-2">
				<LanguageDialog />
				<Button
					variant="ghost"
					size="icon"
					className="cursor-pointer"
					onClick={cycleTheme}
					aria-label={t("topbar.toggleTheme")}
				>
					<Icon className="size-5" />
				</Button>
				<Button variant="ghost" size="icon" asChild>
					<Link
						href="/notifications"
						className="cursor-pointer"
						aria-label={t("topbar.notifications")}
					>
						<Bell className="size-5" />
					</Link>
				</Button>
				<NavUser />
			</div>
		</header>
	);
}