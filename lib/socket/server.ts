import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
	return io;
}

export function setIO(server: SocketIOServer) {
	io = server;
}
