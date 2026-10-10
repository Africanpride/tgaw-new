// Next.js server entry point for TGAW
// Uses output: 'standalone' mode - compatible with Cloudflare Workers deployment
// 
// Chat realtime: Supabase Realtime (browser client via <RealtimeProvider> at app root)
// Slot reminders: can be migrated to Cloudflare Workers cron trigger in future
// No custom Socket.IO server needed

import next from "next";
import { createServer } from "node:http";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

export const config = {
	// Enable API routes and dynamic features
	runtime: "nodejs",
};

app.prepare().then(() => {
	// Create HTTP server for API routes and pages
	const server = createServer(handle as any);

	server.listen(Number(process.env.PORT) || 3000, () => {
		console.log(`> TGAW app running on http://localhost:${process.env.PORT || 3000}`);
	});

	// Note: Slot reminder cron job previously in server.ts
	// Can be migrated to Cloudflare Workers cron trigger later
	// Chat realtime: Supabase Realtime via <RealtimeProvider> at app root
});