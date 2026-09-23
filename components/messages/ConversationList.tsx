"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Search, Loader2, Users, MoreHorizontal, Check, CheckCheck, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	unreadCount: number;
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

type SortMode = "recent" | "unread" | "alpha";

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
	const [sortMode, setSortMode] = useState<SortMode>("recent");
	const [sortOpen, setSortOpen] = useState(false);

	useEffect(() => {
		const q = searchQuery.trim();
		if (!q) {
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

	const filtered = conversations.filter((c) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		const other = c.type === "DIRECT" ? c.members.find((m) => m.id !== myId) : null;
		const name = other?.name || (c.type === "GROUP" ? "Group Chat" : "");
		return name.toLowerCase().includes(q);
	});

	const sorted = [...filtered].sort((a, b) => {
		if (sortMode === "unread") {
			if (a.hasUnread && !b.hasUnread) return -1;
			if (!a.hasUnread && b.hasUnread) return 1;
		}
		if (sortMode === "alpha") {
			const aName = a.type === "DIRECT" ? a.members.find((m) => m.id !== myId)?.name ?? "" : "Group Chat";
			const bName = b.type === "DIRECT" ? b.members.find((m) => m.id !== myId)?.name ?? "" : "Group Chat";
			return aName.localeCompare(bName);
		}
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});

	const SORT_LABELS: Record<SortMode, string> = {
		recent: "Recent Chats",
		unread: "Unread First",
		alpha: "Alphabetical",
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-1 flex-col bg-card">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4">
					<h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
						Chats
					</h2>
					<Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
						<DialogTrigger asChild>
							<button
								type="button"
								className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
								aria-label="New chat"
							>
								<Plus className="size-4" aria-hidden="true" />
							</button>
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
									<input
										type="text"
										placeholder="Search by name, username, or email…"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-10 w-full rounded-md border border-border/30 bg-transparent pl-9 pr-3 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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
											<Avatar>
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

				{/* Search bar */}
				<div className="px-4 pb-3">
						<div className="relative flex h-9 w-full min-w-0 items-center rounded-md border border-border/30 bg-transparent transition-colors focus-within:ring-3 focus-within:ring-ring/50">
						<Search className="absolute left-3 size-4 text-muted-foreground" aria-hidden="true" />
						<input
							type="text"
							placeholder="Search conversations…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-full w-full rounded-none border-0 bg-transparent py-1.5 pl-8 pr-3 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
						/>
					</div>
				</div>

				{/* Sort dropdown */}
				<div className="relative px-4 pb-3">
					<button
						type="button"
						onClick={() => setSortOpen(!sortOpen)}
						className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
					>
						{SORT_LABELS[sortMode]}
						<ChevronDown className={cn("size-4 transition-transform", sortOpen && "rotate-180")} aria-hidden="true" />
					</button>
					{sortOpen && (
						<div className="absolute left-4 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-border/30 bg-background shadow-md">
							{(Object.entries(SORT_LABELS) as [SortMode, string][]).map(([mode, label]) => (
								<button
									key={mode}
									type="button"
									onClick={() => { setSortMode(mode); setSortOpen(false); }}
									className={cn(
										"flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
										sortMode === mode && "bg-muted font-medium",
									)}
								>
									{label}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Conversation list */}
				<ScrollArea className="flex-1">
					<div className="divide-y divide-border/50">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="flex items-center gap-2">
									<Loader2 className="size-4 animate-spin text-muted-foreground" />
									<span className="text-sm text-muted-foreground">Loading…</span>
								</div>
							</div>
						) : sorted.length === 0 ? (
							<EmptyState
								icon={MessageSquare}
								title="No conversations yet"
								description="Start a new conversation using the + button above."
								className="my-6"
							/>
						) : (
							sorted.map((conv) => {
								const otherMember = conv.type === "DIRECT"
									? conv.members.find((m) => m.id !== myId)
									: null;
								const isActive = conv.id === activeId;
								const lastMsg = conv.messages?.[0];
								const displayName = otherMember?.name || (conv.type === "GROUP" ? "Group Chat" : "Unknown");
								const online = otherMember ? isOnline(otherMember.id) : false;

								const lastMsgSender = lastMsg
									? conv.type === "GROUP"
										? conv.members.find((m) => m.id === lastMsg.senderId)?.name?.split(" ")[0]
										: null
									: null;

								return (
									<button
										key={conv.id}
										type="button"
										onClick={() => onSelect(conv.id)}
										className={cn(
											"group/item relative flex w-full cursor-pointer items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-muted",
											isActive && "bg-muted",
										)}
									>
										<div className="relative shrink-0">
											<Avatar>
												{conv.type === "GROUP" ? (
													<AvatarFallback className="bg-muted text-xs font-medium">
														<Users className="size-4 text-muted-foreground" />
													</AvatarFallback>
												) : (
													<>
														{otherMember?.image && (
															<AvatarImage src={otherMember.image} alt={displayName} />
														)}
														<AvatarFallback className="text-xs font-medium">
															{otherMember?.initials || displayName.slice(0, 2).toUpperCase()}
														</AvatarFallback>
													</>
												)}
											</Avatar>
											{conv.type === "DIRECT" && online && (
												<span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-background bg-chart-2" />
											)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<p className={cn(
													"truncate text-sm",
													conv.hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground",
												)}>
													{displayName}
												</p>
												<div className="flex shrink-0 items-center gap-1.5">
													{lastMsg && lastMsg.senderId === myId && (
														<span className="text-muted-foreground">
															{lastMsg.readBy.length > 1
																? <CheckCheck className="size-3.5 text-chart-2" />
																: <Check className="size-3.5" />
															}
														</span>
													)}
													{lastMsg && (
														<span className={cn(
															"text-[10px]",
															conv.hasUnread ? "font-medium text-foreground" : "text-muted-foreground",
														)}>
															{timeAgo(lastMsg.createdAt)}
														</span>
													)}
												</div>
											</div>
											<div className="flex items-center justify-between gap-2">
												<p className={cn(
													"truncate text-xs leading-relaxed",
													conv.hasUnread ? "font-medium text-foreground" : "text-muted-foreground",
												)}>
													{lastMsg
														? lastMsgSender
															? `${lastMsgSender}: ${lastMsg.body}`
															: lastMsg.body
														: "No messages yet"
													}
												</p>
												{conv.hasUnread && conv.unreadCount > 0 && (
													<span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
														{conv.unreadCount > 99 ? "99+" : conv.unreadCount}
													</span>
												)}
											</div>
										</div>

										{/* Hover-only ellipsis menu */}
										<div className="absolute right-2 top-1/2 -translate-y-1/2 bg-linear-to-l from-muted to-transparent pl-6 pr-2 opacity-0 transition-opacity group-hover/item:opacity-100">
											<div
												role="button"
												tabIndex={0}
												className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
												aria-label="More options"
											>
												<MoreHorizontal className="size-4" />
											</div>
										</div>
									</button>
								);
							})
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}
