"use client";

import { useState, useCallback } from "react";

interface TypingUser {
	userId: string;
	name: string;
}

export function useTyping(
	conversationId: string | null,
	myId: string | undefined,
	myName: string | undefined
) {
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

	const emitTyping = useCallback(
		() => {
			// No-op: typing events are not broadcast without Socket.IO/Supabase Presence
		},
		[conversationId, myId, myName]
	);

	const stopTyping = useCallback(
		() => {
			// No-op: typing stop events are not broadcast without Socket.IO
		},
		[]
	);

	const addTypingUser = useCallback(
		(userId: string, name: string) => {
			setTypingUsers((prev) =>
				prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, name: name ?? "..." }]
			);
		},
		[]
	);

	const removeTypingUser = useCallback(
		(userId: string) => {
			setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
		},
		[]
	);

	return { typingUsers, emitTyping, stopTyping, addTypingUser, removeTypingUser };
}