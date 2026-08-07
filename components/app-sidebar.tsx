"use client";

import {
	Home,
	BookOpen,
	Calendar,
	Book,
	Music,
	MessageCircle,
	PenTool,
	MessageSquare,
	Users,
	Shield,
	ShieldCheck,
	UserCog,
	Church,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

const navData = [
	{
		title: "Overview",
		url: "/overview",
		icon: <Home />,
	},
	{
		title: "Devotion",
		url: "#",
		icon: <BookOpen />,
		items: [
			{
				title: "Calendar",
				url: "/calendar",
				icon: <Calendar className="size-4" />,
			},
			{
				title: "Bible Reading",
				url: "/bible",
				icon: <Book className="size-4" />,
			},
			{
				title: "Prayer",
				url: "/prayer",
				icon: <Church className="size-4" />,
			},
			{
				title: "Praise & Worship",
				url: "/worship",
				icon: <Music className="size-4" />,
			},
		],
	},
	{
		title: "Community",
		url: "#",
		icon: <MessageCircle />,
		items: [
			{
				title: "Feed",
				url: "/feed",
				icon: <PenTool className="size-4" />,
			},
			{
				title: "Messages",
				url: "/messages",
				icon: <MessageSquare className="size-4" />,
			},
			{
				title: "Groups",
				url: "/groups",
				icon: <Users className="size-4" />,
			},
		],
	},
];

const adminItems = [
	{
		title: "Admin",
		url: "#",
		icon: <Shield />,
		items: [
			{
				title: "Admin Portal",
				url: "/admin",
				icon: <Shield className="size-4" />,
			},
			{
				title: "User Management",
				url: "/admin/users",
				icon: <UserCog className="size-4" />,
			},
		],
	},
];

export function AppSidebar({
	role,
	...props
}: React.ComponentProps<typeof Sidebar> & { role?: string }) {
	const filteredAdminItems =
		role === "admin" ? adminItems : [];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center gap-2 px-2 py-1.5">
				<ShieldCheck
					className="size-6"
				/>
					<span className="truncate text-lg font-semibold group-data-[collapsible=icon]:hidden">
						TGAW
					</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={[...navData, ...filteredAdminItems]} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
