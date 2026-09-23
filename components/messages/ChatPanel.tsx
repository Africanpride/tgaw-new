"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Users, WifiOff, Phone, Video, MoreHorizontal, Images } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TypingIndicator } from "./TypingIndicator";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { MediaSidebar } from "./MediaSidebar";
import { EmptyState } from "@/components/EmptyState";
import { useMessages, type ChatMessage } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useSocket } from "@/providers/SocketProvider";
import { toast } from "sonner";
import type { Conversation } from "./ConversationList";

function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDateLabel(dateStr: string): string {
	const d = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - d.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
	return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface ChatPanelProps {
	conversation: Conversation | undefined;
	myId: string | undefined;
	myName: string | undefined;
	onBack: () => void;
	isOnline: (userId: string) => boolean;
}

export function ChatPanel({
	conversation,
	myId,
	myName,
	onBack,
	isOnline,
}: ChatPanelProps) {
	const { connected } = useSocket();
	const { messages, setMessages, loading, scrollRef: hookScrollRef, bottomRef } = useMessages(conversation?.id ?? null);

	const { typingUsers, emitTyping, stopTyping } = useTyping(
		conversation?.id ?? null,
		myId,
		myName,
	);

	const memberMap = useMemo(() => {
		const map = new Map<string, { name: string; initials: string | null; image: string | null; username: string | null }>();
		conversation?.members.forEach((m) => map.set(m.id, m));
		return map;
	}, [conversation?.members]);

	const onlineCount = useMemo(
		() => conversation?.memberIds.filter((id) => isOnline(id)).length ?? 0,
		[conversation?.memberIds, isOnline],
	);

	const [value, setValue] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [showMedia, setShowMedia] = useState(true);
	const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
	const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

	const handleSend = useCallback(() => {
		if (!value.trim() || !conversation?.id) return;

		if (editingMessage) {
			fetch(`/api/v1/messages/${editingMessage.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ body: value.trim() }),
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.success) {
						setEditingMessage(null);
						setMessages((prev) =>
							prev.map((m) =>
								m.id === editingMessage.id
									? { ...m, body: value.trim(), editedAt: data.data?.editedAt ?? new Date().toISOString() }
									: m
							)
						);
					} else {
						toast.error("Failed to edit message");
					}
				})
				.catch(() => toast.error("Failed to edit message"));
		} else {
			fetch("/api/v1/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					conversationId: conversation.id,
					body: value.trim(),
					replyToId: replyTo?.id ?? undefined,
				}),
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.success) {
						setMessages((prev) => {
							if (prev.some((m) => m.id === data.data.id)) return prev;
							return [...prev, data.data];
						});
					} else {
						toast.error("Failed to send message");
					}
				})
				.catch(() => toast.error("Failed to send message"));
		}

		setValue("");
		setReplyTo(null);
		stopTyping();
	}, [value, conversation, editingMessage, replyTo, stopTyping, setMessages]);

	const handleEdit = useCallback((msg: ChatMessage) => {
		setEditingMessage(msg);
		setValue(msg.body);
		setReplyTo(null);
	}, []);

	const handleCancelEdit = useCallback(() => {
		setEditingMessage(null);
		setValue("");
	}, []);

	const handleCancelReply = useCallback(() => {
		setReplyTo(null);
	}, []);

	const handleDelete = useCallback(async (messageId: string) => {
		try {
			const res = await fetch(`/api/v1/messages/${messageId}`, { method: "DELETE" });
			const data = await res.json();
			if (data.success) {
				setMessages((prev) =>
					prev.map((m) =>
						m.id === messageId
							? { ...m, deletedAt: new Date().toISOString(), body: "" }
							: m
					)
				);
			} else {
				toast.error("Failed to delete message");
			}
		} catch {
			toast.error("Failed to delete message");
		}
	}, [setMessages]);

	const handleReact = useCallback(async (messageId: string, emoji: string) => {
		try {
			const res = await fetch(`/api/v1/messages/${messageId}/reactions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emoji }),
			});
			const data = await res.json();
			if (data.success) {
				const action = data.data.action as "added" | "removed";
				setMessages((prev) =>
					prev.map((m) => {
						if (m.id !== messageId) return m;
						if (action === "added") {
							return {
								...m,
								reactions: [
									...m.reactions,
									{ id: `optimistic-${messageId}-${emoji}`, userId: myId ?? "", emoji },
								],
							};
						}
						return {
							...m,
							reactions: m.reactions.filter(
								(r) => !(r.userId === myId && r.emoji === emoji)
							),
						};
					})
				);
			} else {
				toast.error("Failed to react");
			}
		} catch {
			toast.error("Failed to react");
		}
	}, [myId, setMessages]);

	if (!conversation) {
		return (
			<div className="flex h-full flex-col items-center justify-center bg-background p-6">
				<EmptyState
					icon={Users}
					title="Select a conversation"
					description="Choose from the list to start messaging"
				/>
			</div>
		);
	}

	const otherMember = conversation.type === "DIRECT"
		? conversation.members.find((m) => m.id !== myId)
		: null;
	const displayName = otherMember?.name || "Group Chat";
	const online = otherMember ? isOnline(otherMember.id) : false;

	const hasMedia = messages.some((m) => m.attachmentUrl);

	return (
		<div className="flex h-full flex-col bg-background w-full">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3">
				<Button
					variant="ghost"
					size="icon"
					className="size-8 cursor-pointer md:hidden"
					onClick={onBack}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
					<span className="sr-only">Back</span>
				</Button>

				<div className="relative shrink-0">
					<Avatar>
						{otherMember?.image && <AvatarImage src={otherMember.image} alt={displayName} />}
						<AvatarFallback className="text-xs">
							{otherMember?.initials || (conversation.type === "GROUP" ? <Users className="size-3.5" /> : displayName.slice(0, 2).toUpperCase())}
						</AvatarFallback>
					</Avatar>
					{conversation.type === "DIRECT" && online && (
						<span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-background bg-chart-2" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
					{conversation.type === "DIRECT" ? (
						<p className={cn("truncate text-xs", online ? "text-green-500" : "text-muted-foreground")}>
							{online ? "Online" : "Offline"}
						</p>
					) : (
						<p className="truncate text-xs text-muted-foreground">
							{conversation.memberIds.length} members · {onlineCount} online
						</p>
					)}
				</div>

				{!connected && (
					<div className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1">
						<WifiOff className="size-3 text-destructive" />
						<span className="text-[10px] font-medium text-destructive">Reconnecting…</span>
					</div>
				)}

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
					>
						<Phone className="size-4" aria-hidden="true" />
						<span className="sr-only">Voice call</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
					>
						<Video className="size-4" aria-hidden="true" />
						<span className="sr-only">Video call</span>
					</Button>
					{hasMedia && (
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"size-8 cursor-pointer hover:text-foreground",
								showMedia ? "text-foreground" : "text-muted-foreground",
							)}
							onClick={() => setShowMedia(!showMedia)}
						>
							<Images className="size-4" aria-hidden="true" />
							<span className="sr-only">Media</span>
						</Button>
					)}
					{conversation.type === "GROUP" && (
						<Button
							variant="ghost"
							size="icon"
							className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
							onClick={() => setShowDetails(!showDetails)}
						>
							<MoreHorizontal className="size-4" aria-hidden="true" />
							<span className="sr-only">Group details</span>
						</Button>
					)}
				</div>
			</div>

			{showDetails && (
				<div className="border-b border-border/30 bg-muted/30 px-4 py-3">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Members</p>
					<div className="space-y-1.5">
						{conversation.members.map((m) => (
							<div key={m.id} className="flex items-center gap-2">
								<Avatar>
									{m.image && <AvatarImage src={m.image} alt={m.name} />}
									<AvatarFallback className="text-[10px]">
										{m.initials || m.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="text-xs">{m.name}</span>
								{m.username && <span className="text-xs text-muted-foreground">@{m.username}</span>}
							</div>
						))}
					</div>
				</div>
			)}

			<Separator />

			{/* Messages + right sidebar */}
			<div className="flex min-h-0 flex-1">
				{/* Messages area */}
				<div className={cn(
					"flex min-h-0 flex-col transition-all",
					showMedia && hasMedia ? "w-[calc(100%-300px)]" : "w-full",
				)}>
					<div ref={hookScrollRef} className="flex-1 overflow-y-auto scroll-smooth">
						<div className="flex flex-col gap-6 px-5 py-5">
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<div className="flex items-center gap-2">
										<Loader2 className="size-4 animate-spin text-muted-foreground" />
										<span className="text-sm text-muted-foreground">Loading messages…</span>
									</div>
								</div>
							) : messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
										<span className="text-2xl">💬</span>
									</div>
									<p className="text-sm font-medium text-foreground">No messages yet</p>
									<p className="mt-1 text-xs text-muted-foreground">Send a message to start the conversation</p>
								</div>
							) : (
								<>
									{messages.map((msg, i) => {
										const prevMsg = i > 0 ? messages[i - 1] : null;
										const showDate = !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);
										return (
											<div key={msg.id}>
												{showDate && (
													<div className="flex items-center justify-center py-3">
														<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
															{formatDateLabel(msg.createdAt)}
														</span>
													</div>
												)}
												<ChatBubble
													message={msg}
													isMine={msg.senderId === myId}
													onReply={setReplyTo}
													onEdit={handleEdit}
													onDelete={handleDelete}
													onReact={handleReact}
													senderName={memberMap.get(msg.senderId)?.name}
													showSender={conversation.type === "GROUP" && msg.senderId !== myId}
												/>
											</div>
										);
									})}
									<div ref={bottomRef} />
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right sidebar — Media */}
				{showMedia && hasMedia && (
					<div className="hidden w-[300px] shrink-0 border-l border-border/30 xl:block">
						<MediaSidebar messages={messages} />
					</div>
				)}
			</div>

			{/* Typing indicator */}
			{typingUsers.length > 0 && (
				<div className="px-4 py-1">
					<TypingIndicator users={typingUsers} />
				</div>
			)}

			<Separator />

			{/* Input */}
			<ChatInput
				value={value}
				onChange={setValue}
				onSend={handleSend}
				onTyping={emitTyping}
				replyTo={replyTo}
				onCancelReply={handleCancelReply}
				editingMessage={editingMessage}
				onCancelEdit={handleCancelEdit}
			/>
		</div>
	);
}
