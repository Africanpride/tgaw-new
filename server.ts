// Force IPv4 DNS resolution before any imports
import { setDefaultAutoSelectFamily } from "node:net";
setDefaultAutoSelectFamily(true); // Force IPv4

import { createServer } from "node:http";
import next from "next";
import { Server, type Socket } from "socket.io";
import { auth, mongoClient } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { dispatchNotification } from "@/lib/notifications/dispatch";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track intervals/timeouts for cleanup
const intervals: NodeJS.Timeout[] = [];
const timeouts: NodeJS.Timeout[] = [];

function clearAllTimers() {
	for (const t of timeouts) clearTimeout(t);
	for (const i of intervals) clearInterval(i);
	timeouts.length = 0;
	intervals.length = 0;
}

async function shutdown() {
	console.log("[SHUTDOWN] Graceful shutdown initiated...");
	clearAllTimers();

	// Close Socket.IO
	if (io) {
		io.close();
		console.log("[SHUTDOWN] Socket.IO closed");
	}

	// Close HTTP server
	if (httpServer) {
		await new Promise<void>((resolve) => {
			httpServer!.close(() => {
				console.log("[SHUTDOWN] HTTP server closed");
				resolve();
			});
		});
	}

	// Disconnect Prisma
	await prisma.$disconnect();
	console.log("[SHUTDOWN] Prisma disconnected");

	// Close MongoDB client
	await mongoClient.close();
	console.log("[SHUTDOWN] MongoDB client closed");

	process.exit(0);
}

let httpServer: ReturnType<typeof createServer> | null = null;
let io: InstanceType<typeof Server> | null = null;

app.prepare().then(() => {
	httpServer = createServer((req, res) => handle(req, res));
	io = new Server(httpServer, { path: "/socket.io" });

	io.use(async (socket: Socket, next: (err?: Error) => void) => {
		try {
			const session = await auth.api.getSession({
				headers: socket.handshake.headers as unknown as Headers,
			});
			if (!session?.user) return next(new Error("Unauthorized"));
		(socket.data as { userId: string }).userId = session.user.id;
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

		socket.on("message:send", (payload: { conversationId: string; [key: string]: unknown }) => {
			io?.to(payload.conversationId).emit("message:new", payload);
		});

		// Track connected sockets for potential cleanup
		socket.on("disconnect", () => {
			// Socket disconnected, cleanup handled by Socket.IO
		});
	});

	const port = Number(process.env.PORT) || 3000;
	httpServer.listen(port, () => {
		console.log(`> Server listening on http://localhost:${port}`);
	});

	// ── Slot reminder loop: every 2 minutes ──────────────────────────────
	const REMINDER_INTERVAL_MS = 2 * 60 * 1000;
	const REMINDER_WINDOW_MIN = 15;
	// In-memory dedup for Slot reminders (no reminderSent flag on Slot model)
	const remindedSlotIds = new Set<string>();

	// Periodic cleanup of dedup set (keep 2h)
	const dedupCleanupInterval = setInterval(() => {
		remindedSlotIds.clear();
	}, 60 * 60 * 1000 * 2);
	intervals.push(dedupCleanupInterval);

	async function runReminderTick() {
		try {
			const now = new Date();
			const today = now.toISOString().split("T")[0];
			const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

			// 1) Slot reminders: slots starting within next REMINDER_WINDOW_MIN minutes
			const slotsStartingSoon = await prisma.slot.findMany({
				where: {
					date: today,
					bookedBy: { not: null },
				},
				select: { id: true, type: true, date: true, startTime: true, bookedBy: true },
			});

			const dueSlots = slotsStartingSoon.filter((s) => {
				if (remindedSlotIds.has(s.id)) return false;
				const [h, m] = s.startTime.split(":").map(Number);
				const slotMinutes = h * 60 + m;
				const diff = slotMinutes - nowMinutes;
				return diff >= 0 && diff <= REMINDER_WINDOW_MIN;
			});

			for (const slot of dueSlots) {
				// meeting link lookup (best-effort)
				let linkSuffix = "";
				try {
					const ml = await prisma.meetingLink.findFirst({
						where: { type: slot.type, date: slot.date },
						select: { url: true },
					});
					const fallback = !ml ? await prisma.meetingLink.findFirst({ where: { type: slot.type, date: "DEFAULT" }, select: { url: true } }) : null;
					const url = ml?.url ?? fallback?.url;
					if (url) linkSuffix = ` Join: ${url}`;
				} catch {
					// ignore
				}
				try {
					await dispatchNotification({
						userId: slot.bookedBy!,
						type: "SLOT_REMINDER",
						title: "Session starting soon",
						body: `Your ${slot.type} session starts in ${REMINDER_WINDOW_MIN} minutes at ${slot.startTime} UTC.${linkSuffix}`,
						link: "/booking",
					});
					remindedSlotIds.add(slot.id);
				} catch (e) {
					console.error("[ERROR] slot reminder dispatch failed", e instanceof Error ? e.message : String(e));
				}
			}

			// 2) Legacy EventBooking reminders (Event model) where reminderSent = false and event starts soon
			try {
				const pendingBookings = await prisma.eventBooking.findMany({
					where: { reminderSent: false, status: "CONFIRMED" },
					select: { id: true, userId: true, eventId: true },
				});
				if (pendingBookings.length > 0) {
					const eventIds = [...new Set(pendingBookings.map((b) => b.eventId))];
					const events = await prisma.event.findMany({
						where: { id: { in: eventIds } },
						select: { id: true, date: true, time: true, title: true, zoomUrl: true, type: true },
					});
					const eventMap = new Map(events.map((e) => [e.id, e]));
					for (const booking of pendingBookings) {
						const ev = eventMap.get(booking.eventId);
						if (!ev) continue;
						if (ev.date !== today) continue;
						const [h, m] = ev.time.split(":").map(Number);
						const evMinutes = h * 60 + m;
						const diff = evMinutes - nowMinutes;
						if (diff < 0 || diff > REMINDER_WINDOW_MIN) continue;
						try {
							const suffix = ev.zoomUrl ? ` Join: ${ev.zoomUrl}` : "";
							await dispatchNotification({
								userId: booking.userId,
								type: "SLOT_REMINDER",
								title: "Event starting soon",
								body: `Your event "${ev.title}" starts in ${diff} minutes at ${ev.time} UTC.${suffix}`,
								link: "/calendar",
							});
							await prisma.eventBooking.update({ where: { id: booking.id }, data: { reminderSent: true } });
						} catch (e) {
							console.error("[ERROR] event booking reminder failed", e instanceof Error ? e.message : String(e));
						}
					}
				}
			} catch (e) {
				// Slot-only deployments may not have EventBooking — ignore
				if (e instanceof Error && !e.message.includes("EventBooking")) {
					console.error("[ERROR] event reminder tick error", e.message);
				}
			}
		} catch (e) {
			console.error("[ERROR] reminder tick failed", e instanceof Error ? e.message : String(e));
		}
	}

	// Kick off first tick after 15s, then every 2 mins
	const initialTimeout = setTimeout(runReminderTick, 15_000);
	timeouts.push(initialTimeout);

	const reminderInterval = setInterval(runReminderTick, REMINDER_INTERVAL_MS);
	intervals.push(reminderInterval);
});

// Graceful shutdown handlers
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("uncaughtException", (err) => {
	console.error("[FATAL] Uncaught exception:", err);
	shutdown();
});
process.on("unhandledRejection", (reason) => {
	console.error("[FATAL] Unhandled rejection:", reason);
	shutdown();
});
