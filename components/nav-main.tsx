"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: React.ReactNode;
		items?: {
			title: string;
			url: string;
			icon?: React.ReactNode;
			minRole?: string;
		}[];
	}[];
}) {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();

	const closeOnNavigate = () => {
		setOpenMobile(false);
	};

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => {
					const hasSubItems = item.items && item.items.length > 0;
					const isOverview = item.title === "Overview" && !hasSubItems;

					if (isOverview) {
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									render={
										<Link
											href={item.url}
											className="cursor-pointer"
											onClick={closeOnNavigate}
										/>
									}
									isActive={pathname === item.url}
									tooltip={item.title}
								>
									{item.icon}
									<span>{item.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					}

					return (
						<Collapsible
							key={item.title}
							defaultOpen
							className="group/collapsible"
						>
							<SidebarMenuItem>
								<CollapsibleTrigger
									render={<SidebarMenuButton tooltip={item.title} />}
								>
									{item.icon}
									<span>{item.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													render={
														<Link
															href={subItem.url}
															className="cursor-pointer"
															onClick={closeOnNavigate}
														/>
													}
													isActive={pathname === subItem.url}
												>
													{subItem.icon}
													<span>{subItem.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
