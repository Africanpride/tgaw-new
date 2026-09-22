"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";

export function usePresence() {
	const { socket } = useSocket();
	const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

	useEffect(() => {
		if (!socket) return;

		const handlePresence = (data: { userId: string; online: boolean }) => {
			setOnlineUsers((prev) => {
				const next = new Map(prev);
				next.set(data.userId, data.online);
				return next;
			});
		};

		socket.on("presence:state", handlePresence);
		return () => {
			socket.off("presence:state", handlePresence);
		};
	}, [socket]);

	const isOnline = useCallback(
		(userId: string) => onlineUsers.get(userId) ?? false,
		[onlineUsers]
	);

	return { isOnline, onlineUsers };
}
