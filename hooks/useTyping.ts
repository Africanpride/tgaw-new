"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/providers/SocketProvider";

interface TypingUser {
	userId: string;
	name: string;
}

export function useTyping(
	conversationId: string | null,
	myId: string | undefined,
	myName: string | undefined
) {
	const { socket } = useSocket();
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingRef = useRef(false);

	// Listen for typing events
	useEffect(() => {
		if (!socket || !conversationId) return;

		const handleStart = (data: { conversationId: string; userId: string; name: string }) => {
			if (data.conversationId !== conversationId) return;
			if (data.userId === myId) return;
			setTypingUsers((prev) => {
				if (prev.some((u) => u.userId === data.userId)) return prev;
				return [...prev, { userId: data.userId, name: data.name }];
			});
		};

		const handleStop = (data: { conversationId: string; userId: string }) => {
			if (data.conversationId !== conversationId) return;
			setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
		};

		socket.on("typing:start", handleStart);
		socket.on("typing:stop", handleStop);
		return () => {
			socket.off("typing:start", handleStart);
			socket.off("typing:stop", handleStop);
			setTypingUsers([]);
		};
	}, [socket, conversationId, myId]);

	const emitTyping = useCallback(() => {
		if (!socket || !conversationId || !myId || !myName) return;

		if (!isTypingRef.current) {
			isTypingRef.current = true;
			socket.emit("typing:start", { conversationId, userId: myId, name: myName });
		}

		// Reset the auto-stop timer
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			isTypingRef.current = false;
			socket.emit("typing:stop", { conversationId, userId: myId });
		}, 3000);
	}, [socket, conversationId, myId, myName]);

	const stopTyping = useCallback(() => {
		if (!socket || !conversationId || !myId) return;
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		if (isTypingRef.current) {
			isTypingRef.current = false;
			socket.emit("typing:stop", { conversationId, userId: myId });
		}
	}, [socket, conversationId, myId]);

	return { typingUsers, emitTyping, stopTyping };
}
