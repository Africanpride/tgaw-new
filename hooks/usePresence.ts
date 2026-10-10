"use client";

import { useState, useCallback } from "react";

export function usePresence() {
	const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

	// Presence tracking is handled by Supabase postgres_changes via the message system.
	// For now, this hook provides a placeholder Map that components can use if needed.
	// Real-time presence updates would require a separate Presence channel or Supabase Presence API.

	const isOnline = useCallback(
		(userId: string) => onlineUsers.get(userId) ?? false,
		[onlineUsers]
	);

	const addUser = useCallback((userId: string, online: boolean) => {
		setOnlineUsers((prev) => {
			const next = new Map(prev);
			next.set(userId, online);
			return next;
		});
	}, []);

	const removeUser = useCallback((userId: string) => {
		setOnlineUsers((prev) => {
			const next = new Map(prev);
			next.delete(userId);
			return next;
		});
	}, []);

	return { isOnline, onlineUsers, addUser, removeUser };
}