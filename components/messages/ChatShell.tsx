"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ConversationList, type Conversation } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";
import { usePresence } from "@/hooks/usePresence";
import { useSession } from "@/lib/auth-client";
import { useSocket } from "@/providers/SocketProvider";

export function ChatShell() {
	const { data: session } = useSession();
	const myId = session?.user?.id;
	const myName = session?.user?.name;

	const { socket } = useSocket();
	const { isOnline } = usePresence();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchConversations = useCallback(async () => {
		try {
			const res = await fetch("/api/v1/conversations");
			if (!res.ok) {
				setConversations([]);
				return;
			}
			const text = await res.text();
			if (!text) {
				setConversations([]);
				return;
			}
			const data = JSON.parse(text);
			if (data.success) setConversations(data.data);
		} catch {
			setConversations([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchConversations();
	}, [fetchConversations]);

	useEffect(() => {
		if (!socket || !myId) return;

		const handleMessageNew = (msg: { id: string; conversationId: string; body: string; senderId: string; createdAt: string; readBy: string[] }) => {
			setConversations((prev) => {
				const idx = prev.findIndex((c) => c.id === msg.conversationId);
				if (idx === -1) {
					fetchConversations();
					return prev;
				}
				const updated = [...prev];
				const conv = { ...updated[idx] };
				conv.messages = [{ id: msg.id, body: msg.body, senderId: msg.senderId, readBy: msg.readBy, createdAt: msg.createdAt }];
				conv.updatedAt = msg.createdAt;
				conv.hasUnread = msg.senderId !== myId;
				updated.splice(idx, 1);
				return [conv, ...updated];
			});
		};

		const handleRead = (data: { conversationId: string; userId: string }) => {
			if (data.userId !== myId) return;
			setConversations((prev) =>
				prev.map((c) => (c.id === data.conversationId ? { ...c, hasUnread: false } : c)),
			);
		};

		socket.on("message:new", handleMessageNew);
		socket.on("message:read", handleRead);
		return () => {
			socket.off("message:new", handleMessageNew);
			socket.off("message:read", handleRead);
		};
	}, [socket, myId, fetchConversations]);

	const activeConversation = conversations.find((c) => c.id === activeId);

	return (
		<div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden rounded-xl border bg-background shadow-sm md:h-[calc(100dvh-6rem)]">
			<div
				className={cn(
					"w-full shrink-0 md:w-80 lg:w-96",
					activeId ? "hidden md:block" : "block",
				)}
			>
				<ConversationList
					conversations={conversations}
					activeId={activeId}
					myId={myId}
					isOnline={isOnline}
					onSelect={setActiveId}
					onConversationCreated={fetchConversations}
					loading={loading}
				/>
			</div>

			<div
				className={cn(
					"flex-1",
					!activeId ? "hidden md:flex" : "flex",
				)}
			>
				<ChatPanel
					conversation={activeConversation}
					myId={myId}
					myName={myName}
					onBack={() => setActiveId(null)}
					isOnline={isOnline}
				/>
			</div>
		</div>
	);
}
