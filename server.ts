import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { auth } from "@/lib/auth";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const httpServer = createServer((req, res) => handle(req, res));
	const io = new Server(httpServer, { path: "/socket.io" });

	io.use(async (socket, next) => {
		try {
			const session = await auth.api.getSession({
				headers: socket.handshake.headers as unknown as Headers,
			});
			if (!session?.user) return next(new Error("Unauthorized"));
			socket.data.userId = session.user.id;
			next();
		} catch {
			next(new Error("Unauthorized"));
		}
	});

	io.on("connection", (socket) => {
		socket.on("conversation:join", (conversationId: string) => {
			socket.join(conversationId);
		});

		socket.on("conversation:leave", (conversationId: string) => {
			socket.leave(conversationId);
		});

		socket.on("message:send", (payload) => {
			io.to(payload.conversationId).emit("message:new", payload);
		});
	});

	const port = Number(process.env.PORT) || 3000;
	httpServer.listen(port, () => {
		console.log(`> Server listening on http://localhost:${port}`);
	});
});
