import type { Server as SocketIOServer } from "socket.io";

// Store on globalThis so the singleton survives Turbopack's module bundling.
// server.ts (tsx) and API routes (Turbopack-compiled) each get their own
// module scope, but globalThis is process-wide.
const GLOBAL_KEY = "__tgaw_socket_io__";

export function getIO(): SocketIOServer | null {
	return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as SocketIOServer | null;
}

export function setIO(server: SocketIOServer) {
	(globalThis as Record<string, unknown>)[GLOBAL_KEY] = server;
}
