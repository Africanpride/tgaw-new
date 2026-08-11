"use client";

import { CircleUser, Globe, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";

export function NavUser() {
	const { data: session } = useSession();
	const { isMobile } = useSidebar();
	const router = useRouter();

	const user = session?.user;
	const name = user?.name ?? "User";
	const email = user?.email ?? "";
	const role = (user?.role as string) ?? "member";
	const initials = name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
				<Avatar className="size-9">
					<AvatarImage src={user?.image ?? undefined} alt={name} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-72 rounded-lg"
				side={isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={8}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar className="size-8">
								<AvatarImage src={user?.image ?? undefined} alt={name} />
								<AvatarFallback>{initials}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{name}</span>
								<span className="flex items-center gap-1.5 text-xs">
									<span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
										{role}
									</span>
									<span className="truncate">{email}</span>
								</span>
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => router.push("/settings")}
					>
						<CircleUser />
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => router.push("/settings")}
					>
						<Settings />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem render={<Link href="/" className="cursor-pointer" />}>
					<Globe />
					Back to Website
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
					<LogOut />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
