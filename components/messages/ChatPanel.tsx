"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Info, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresenceIndicator } from "./PresenceIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { useMessages, type ChatMessage } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { toast } from "sonner";
import type { Conversation } from "./ConversationList";

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
	const { messages, loading, scrollRef: hookScrollRef } = useMessages(conversation?.id ?? null);

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
					if (data.success) setEditingMessage(null);
					else toast.error("Failed to edit message");
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
					if (!data.success) toast.error("Failed to send message");
				})
				.catch(() => toast.error("Failed to send message"));
		}

		setValue("");
		setReplyTo(null);
		stopTyping();
	}, [value, conversation, editingMessage, replyTo, stopTyping]);

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
			if (!data.success) toast.error("Failed to delete message");
		} catch {
			toast.error("Failed to delete message");
		}
	}, []);

	const handleReact = useCallback(async (messageId: string, emoji: string) => {
		try {
			const res = await fetch(`/api/v1/messages/${messageId}/reactions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emoji }),
			});
			const data = await res.json();
			if (!data.success) toast.error("Failed to react");
		} catch {
			toast.error("Failed to react");
		}
	}, []);

	if (!conversation) {
		return (
			<div className="flex h-full flex-col items-center justify-center bg-background p-6">
				<EmptyState
					icon={Info}
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

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center gap-3 border-b px-4 py-3">
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
					<Avatar className="size-9">
						{otherMember?.image && <AvatarImage src={otherMember.image} alt={displayName} />}
						<AvatarFallback className="text-xs">
							{otherMember?.initials || (conversation.type === "GROUP" ? <Users className="size-3.5" /> : displayName.slice(0, 2).toUpperCase())}
						</AvatarFallback>
					</Avatar>
					{conversation.type === "DIRECT" && <PresenceIndicator online={online} size="sm" />}
				</div>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold">{displayName}</p>
					{conversation.type === "DIRECT" ? (
						<p className={cn("truncate text-xs", online ? "text-emerald-500" : "text-muted-foreground")}>
							{online ? "Active now" : "Offline"}
						</p>
					) : (
						<p className="truncate text-xs text-muted-foreground">
							{conversation.memberIds.length} members · {onlineCount} online
						</p>
					)}
				</div>

				{conversation.type === "GROUP" && (
					<Button
						variant="ghost"
						size="icon"
						className="size-8 cursor-pointer"
						onClick={() => setShowDetails(!showDetails)}
					>
						<Info className="size-4" aria-hidden="true" />
						<span className="sr-only">Group details</span>
					</Button>
				)}
			</div>

			{showDetails && (
				<div className="border-b bg-muted/30 px-4 py-3">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Members</p>
					<div className="space-y-1.5">
						{conversation.members.map((m) => (
							<div key={m.id} className="flex items-center gap-2">
								<Avatar className="size-6">
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

			<div ref={hookScrollRef} className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="flex flex-col-reverse gap-1.5 p-4">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="size-5 animate-spin text-muted-foreground" />
							</div>
						) : messages.length === 0 ? (
							<p className="py-12 text-center text-sm text-muted-foreground">
								No messages yet — say hello!
							</p>
						) : (
							messages.map((msg) => (
							<ChatBubble
								key={msg.id}
								message={msg}
								isMine={msg.senderId === myId}
								onReply={setReplyTo}
								onEdit={handleEdit}
								onDelete={handleDelete}
								onReact={handleReact}
								senderName={memberMap.get(msg.senderId)?.name}
							/>
							))
						)}
					</div>
				</ScrollArea>
			</div>

			{typingUsers.length > 0 && (
				<div className="px-4 py-1">
					<TypingIndicator users={typingUsers} />
				</div>
			)}

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
