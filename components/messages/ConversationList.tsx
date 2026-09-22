"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresenceIndicator } from "./PresenceIndicator";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export interface ConversationMember {
	id: string;
	name: string;
	username: string | null;
	initials: string | null;
	image: string | null;
}

export interface Conversation {
	id: string;
	type: "DIRECT" | "GROUP";
	groupId?: string | null;
	memberIds: string[];
	members: ConversationMember[];
	messages?: { id: string; body: string; senderId: string; readBy: string[]; createdAt: string }[];
	hasUnread: boolean;
	updatedAt: string;
}

interface ConversationListProps {
	conversations: Conversation[];
	activeId: string | null;
	myId: string | undefined;
	isOnline: (userId: string) => boolean;
	onSelect: (id: string) => void;
	onConversationCreated: () => void;
	loading: boolean;
}

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d`;
	return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList({
	conversations,
	activeId,
	myId,
	isOnline,
	onSelect,
	onConversationCreated,
	loading,
}: ConversationListProps) {
	const [newChatOpen, setNewChatOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<ConversationMember[]>([]);
	const [searching, setSearching] = useState(false);
	const [starting, setStarting] = useState(false);

	useEffect(() => {
		const q = searchQuery.trim();
		if (!q) {
			// Defer the state clear to avoid synchronous setState in effect
			const id = requestAnimationFrame(() => setSearchResults([]));
			return () => cancelAnimationFrame(id);
		}

		const timer = setTimeout(async () => {
			setSearching(true);
			try {
				const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}`);
				const data = await res.json();
				if (data.success) setSearchResults(data.data);
			} finally {
				setSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	async function startConversation(userId: string) {
		setStarting(true);
		try {
			const res = await fetch("/api/v1/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "DIRECT", memberIds: [userId] }),
			});
			const data = await res.json();
			if (!data.success) throw new Error(data.error || "Failed");
			onConversationCreated();
			onSelect(data.data.id);
			setNewChatOpen(false);
			setSearchQuery("");
			toast.success("Conversation ready");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setStarting(false);
		}
	}

	return (
		<div className="flex h-full flex-col border-r bg-background">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h2 className="text-base font-semibold tracking-tight" style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
					Messages
				</h2>
				<Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
					<DialogTrigger asChild>
						<Button size="icon" variant="ghost" className="size-8 cursor-pointer">
							<Plus className="size-4" aria-hidden="true" />
							<span className="sr-only">New chat</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
								New Conversation
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
								<Input
									placeholder="Search by name, username, or email…"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-10 pl-9"
								/>
							</div>
							<div className="max-h-60 space-y-1 overflow-auto">
								{searching && (
									<div className="flex items-center justify-center py-6">
										<Loader2 className="size-5 animate-spin text-muted-foreground" />
									</div>
								)}
								{!searching && searchResults.length === 0 && searchQuery.trim() && (
									<p className="py-6 text-center text-sm text-muted-foreground">No users found</p>
								)}
								{searchResults.map((user) => (
									<button
										key={user.id}
										type="button"
										onClick={() => startConversation(user.id)}
										disabled={starting}
										className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
									>
										<Avatar className="size-9">
											{user.image && <AvatarImage src={user.image} alt={user.name} />}
											<AvatarFallback className="text-xs">
												{user.initials || user.name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">{user.name}</p>
											{user.username && (
												<p className="truncate text-xs text-muted-foreground">@{user.username}</p>
											)}
										</div>
									</button>
								))}
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<ScrollArea className="flex-1">
				<div className="space-y-0.5 p-2">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-5 animate-spin text-muted-foreground" />
						</div>
					) : conversations.length === 0 ? (
						<EmptyState
							icon={MessageSquare}
							title="No conversations yet"
							description="Start a new conversation using the + button above."
							className="my-6"
						/>
					) : (
						conversations.map((conv) => {
							const otherMember = conv.type === "DIRECT"
								? conv.members.find((m) => m.id !== myId)
								: null;
							const isActive = conv.id === activeId;
							const lastMsg = conv.messages?.[0];
							const displayName = otherMember?.name || (conv.type === "GROUP" ? "Group Chat" : "Unknown");
							const online = otherMember ? isOnline(otherMember.id) : false;

							return (
								<button
									key={conv.id}
									type="button"
									onClick={() => onSelect(conv.id)}
									className={cn(
										"flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
										isActive
											? "bg-muted shadow-sm"
											: "hover:bg-muted/50",
									)}
								>
									<div className="relative shrink-0">
										<Avatar className="size-10">
											{otherMember?.image && (
												<AvatarImage src={otherMember.image} alt={displayName} />
											)}
											<AvatarFallback className="text-xs font-medium">
												{otherMember?.initials || displayName.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										{conv.type === "DIRECT" && <PresenceIndicator online={online} />}
									</div>

									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className={cn("truncate text-sm", conv.hasUnread ? "font-semibold" : "font-medium")}>
												{displayName}
											</p>
											{lastMsg && (
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{timeAgo(lastMsg.createdAt)}
												</span>
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<p className={cn(
												"truncate text-xs",
												conv.hasUnread ? "font-medium text-foreground" : "text-muted-foreground",
											)}>
												{lastMsg?.body || "No messages yet"}
											</p>
											{conv.hasUnread && (
												<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
													•
												</span>
											)}
										</div>
									</div>
								</button>
							);
						})
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
