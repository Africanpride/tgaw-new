"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ConversationList, type Conversation } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";
import { usePresence } from "@/hooks/usePresence";
import { useSession } from "@/lib/auth-client";
import { getSupabase } from "@/providers/RealtimeProvider";

export function ChatShell() {
	const { data: session } = useSession();
	const myId = session?.user?.id;
	const myName = session?.user?.name;
	const { isOnline } = usePresence();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const activeIdRef = useRef<string | null>(null);
	useEffect(() => {
		activeIdRef.current = activeId;
	});

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
		const id = requestAnimationFrame(() => fetchConversations());
		return () => cancelAnimationFrame(id);
	}, [fetchConversations]);

	useEffect(() => {
		const supa = getSupabase();
		if (!supa || !myId) return;

		const channel = supa.channel(`inbox-${myId}`);

		channel.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "messages",
			},
			(payload) => {
				const msg = payload.new as {
					id: string;
					conversation_id?: string;
					conversationId?: string;
					body: string;
					sender_id?: string;
					senderId?: string;
					created_at?: string;
					createdAt?: string;
					read_by?: string[];
					readBy?: string[];
				};
				const convId = msg.conversationId || msg.conversation_id;
				if (!convId) {
					fetchConversations();
					return;
				}

				setConversations((prev) => {
					const idx = prev.findIndex((c) => c.id === convId);
					if (idx === -1) {
						fetchConversations();
						return prev;
					}
					const updated = [...prev];
					const conv = { ...updated[idx] };
					const sender = msg.senderId || msg.sender_id || "";
					const created = msg.createdAt || msg.created_at || new Date().toISOString();
					const read = msg.readBy || msg.read_by || [];
					conv.messages = [
						{
							id: msg.id,
							body: msg.body,
							senderId: sender,
							readBy: read,
							createdAt: created,
						},
					];
					conv.updatedAt = created;
					const isFromMe = sender === myId;
					const isCurrentActive = activeIdRef.current === convId;
					conv.hasUnread = !isFromMe && !isCurrentActive;
					conv.unreadCount = isFromMe || isCurrentActive ? 0 : (conv.unreadCount || 0) + 1;
					updated.splice(idx, 1);
					return [conv, ...updated];
				});
			}
		);

		channel.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [myId, fetchConversations]);

	const activeConversation = conversations.find((c) => c.id === activeId);

	return (
		<div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden md:h-[calc(100dvh-6rem)]">
			{/* Left column — Conversation list (hidden on mobile when chat is active) */}
			<div
				className={cn(
					"max-w-[300px] shrink-0 border-e border-border/30 sm:max-w-[350px] w-full h-full lg:block",
					activeId ? "hidden" : "block",
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

			{/* Center column — Chat panel */}
			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col",
					!activeId ? "hidden lg:flex" : "flex",
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
