"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/providers/RealtimeProvider";

export interface ChatMessage {
	id: string;
	conversationId: string;
	senderId: string;
	body: string;
	attachmentUrl?: string | null;
	replyToId?: string | null;
	replyTo?: { id: string; body: string; senderId: string; createdAt: string } | null;
	readBy: string[];
	editedAt?: string | null;
	deletedAt?: string | null;
	createdAt: string;
	reactions: { id: string; userId: string; emoji: string }[];
	sender?: { id: string; name: string; initials?: string | null; image?: string | null } | null;
}

export function useMessages(conversationId: string | null) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const loadedConvoRef = useRef<string | null>(null);

	// Fetch initial messages from the API
	useEffect(() => {
		if (!conversationId) {
			const id = requestAnimationFrame(() => setMessages([]));
			loadedConvoRef.current = null;
			return () => cancelAnimationFrame(id);
		}

		if (loadedConvoRef.current === conversationId) return;
		loadedConvoRef.current = conversationId;

		let cancelled = false;
		setLoading(true);

		fetch(`/api/v1/messages?conversationId=${conversationId}&limit=50`)
			.then((r) => r.json())
			.then((data) => {
				if (cancelled) return;
				if (data.success) {
					setMessages(data.data.reverse());
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [conversationId]);

	// Scroll to bottom
	const scrollToBottom = useCallback(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		} else if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, []);

	// Auto-scroll on new messages
	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages.length, scrollToBottom]);

	// Subscribe to new messages via Supabase Realtime
	useEffect(() => {
		if (!conversationId) return;

		const supa = getSupabase();
		if (!supa) return;

		const channel = supa.channel(`chat-${conversationId}`);

		channel.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `conversation_id=eq.${conversationId}`,
			},
			(payload) => {
				// Add new message to state (filter out deleted messages)
				if (payload?.new?.deletedAt) return;
				setMessages((prev) => {
					if (prev.some((m) => m.id === payload.new.id)) return prev;
					// Make sure the sender info is included - fetch from API if needed
					return [...prev, payload.new as ChatMessage];
				});
			}
		);

		channel.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "messages",
				filter: `conversation_id=eq.${conversationId}`,
			},
			(payload) => {
				// Handle message edits
				setMessages((prev) =>
					prev.map((m) =>
						m.id === payload.new.id
							? { ...m, body: payload.new.body, editedAt: payload.new.editedAt }
							: m
					)
				);
			}
		);

		channel.on(
			"postgres_changes",
			{
				event: "DELETE",
				schema: "public",
				table: "messages",
				filter: `conversation_id=eq.${conversationId}`,
			},
			(payload) => {
				// Handle message deletion
				setMessages((prev) =>
					prev.map((m) =>
						m.id === payload.old?.id
							? { ...m, deletedAt: new Date().toISOString(), body: "" }
							: m
					)
				);
			}
		);

		channel.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [conversationId]);

	// Scroll to bottom
	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages.length, scrollToBottom]);

	return { messages, setMessages, loading, scrollRef, bottomRef, scrollToBottom };
}