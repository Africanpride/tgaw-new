"use client";

import { LogOut, Settings, CircleUser } from "lucide-react";
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
import { signOut, useSession } from "@/lib/auth-client";

export function TopbarUserMenu() {
	const { data: session } = useSession();
	const router = useRouter();

	const user = session?.user;
	const name = user?.name ?? "User";
	const email = user?.email ?? "";
	const image = user?.image ?? undefined;
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
			<DropdownMenuTrigger className="cursor-pointer">
				<Avatar className="size-9">
					<AvatarImage src={image} alt={name} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				className="w-56 rounded-2xl data-open:slide-in-from-bottom-20! data-closed:slide-out-to-bottom-20 data-open:fade-in-0 data-closed:fade-out-0 data-closed:zoom-out-100 duration-400"
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="relative">
								<Avatar className="size-10">
									<AvatarImage src={image} alt={name} />
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<span className="ring-card absolute right-0 bottom-0 size-2 rounded-full bg-green-600 ring-2" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-medium">{name}</span>
								<span className="text-sm text-muted-foreground">{email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuItem
						className="cursor-pointer gap-2 p-2 text-sm font-medium"
						onClick={() => router.push("/settings")}
					>
						<CircleUser className="size-5" />
						<span>My Profile</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer gap-2 p-2 text-sm font-medium"
						onClick={() => router.push("/settings")}
					>
						<Settings className="size-5" />
						<span>Settings</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					variant="destructive"
					className="cursor-pointer gap-2 p-2 text-sm font-medium"
					onClick={handleSignOut}
				>
					<LogOut className="size-5" />
					<span>Sign out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
