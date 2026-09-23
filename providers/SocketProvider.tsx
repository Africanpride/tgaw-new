"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket/client";

interface SocketContextValue {
	socket: Socket | null;
	connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
	socket: null,
	connected: false,
});

export function useSocket() {
	return useContext(SocketContext);
}

let sharedSocket: Socket | null = null;

function getSharedSocket(): Socket {
	if (!sharedSocket) {
		sharedSocket = getSocket();
	}
	return sharedSocket;
}

export function SocketProvider({ children }: { children: ReactNode }) {
	const [socket] = useState<Socket>(() => getSharedSocket());
	const [connected, setConnected] = useState(() => socket?.connected ?? false);

	useEffect(() => {
		const s = socket;
		if (!s) return;

		// Sync connected state if socket connected between useState init and effect run
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncing external Socket.IO state
		setConnected(s.connected);

		const onConnect = () => setConnected(true);
		const onDisconnect = () => setConnected(false);
		const onConnectError = (err: Error) => {
			console.warn("[SOCKET] Connection error:", err.message);
			setConnected(false);
		};

		s.on("connect", onConnect);
		s.on("disconnect", onDisconnect);
		s.on("connect_error", onConnectError);

		if (!s.connected) {
			s.connect();
		}

		return () => {
			s.off("connect", onConnect);
			s.off("disconnect", onDisconnect);
			s.off("connect_error", onConnectError);
		};
	}, [socket]);

	return (
		<SocketContext.Provider value={{ socket, connected }}>
			{children}
		</SocketContext.Provider>
	);
}
