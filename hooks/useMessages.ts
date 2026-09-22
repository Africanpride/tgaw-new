"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/providers/SocketProvider";

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
	const { socket } = useSocket();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const loadedConvoRef = useRef<string | null>(null);

	// Fetch messages when conversation changes
	useEffect(() => {
		if (!conversationId) {
			// Defer the state clear to avoid synchronous setState in effect
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
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, []);

	// Auto-scroll on new messages
	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages.length, scrollToBottom]);

	// Listen for socket events
	useEffect(() => {
		if (!socket || !conversationId) return;

		const handleNew = (msg: ChatMessage) => {
			if (msg.conversationId !== conversationId) return;
			setMessages((prev) => {
				if (prev.some((m) => m.id === msg.id)) return prev;
				return [...prev, msg];
			});
		};

		const handleEdited = (data: { messageId: string; conversationId: string; body: string; editedAt: string }) => {
			if (data.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => (m.id === data.messageId ? { ...m, body: data.body, editedAt: data.editedAt } : m))
			);
		};

		const handleDeleted = (data: { messageId: string; conversationId: string }) => {
			if (data.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => (m.id === data.messageId ? { ...m, deletedAt: new Date().toISOString(), body: "" } : m))
			);
		};

		const handleReaction = (data: { messageId: string; conversationId: string; userId: string; emoji: string; action: string }) => {
			if (data.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => {
					if (m.id !== data.messageId) return m;
					if (data.action === "added") {
						return { ...m, reactions: [...m.reactions, { id: `${data.userId}-${data.emoji}`, userId: data.userId, emoji: data.emoji }] };
					}
					return { ...m, reactions: m.reactions.filter((r) => !(r.userId === data.userId && r.emoji === data.emoji)) };
				})
			);
		};

		const handleRead = (data: { conversationId: string; userId: string }) => {
			if (data.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => {
					if (m.senderId !== data.userId && !m.readBy.includes(data.userId)) {
						return { ...m, readBy: [...m.readBy, data.userId] };
					}
					return m;
				})
			);
		};

		socket.on("message:new", handleNew);
		socket.on("message:edited", handleEdited);
		socket.on("message:deleted", handleDeleted);
		socket.on("message:reaction", handleReaction);
		socket.on("message:read", handleRead);

		return () => {
			socket.off("message:new", handleNew);
			socket.off("message:edited", handleEdited);
			socket.off("message:deleted", handleDeleted);
			socket.off("message:reaction", handleReaction);
			socket.off("message:read", handleRead);
		};
	}, [socket, conversationId]);

	return { messages, setMessages, loading, scrollRef, scrollToBottom };
}
