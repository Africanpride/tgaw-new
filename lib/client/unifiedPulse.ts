import type { ActivityItem } from "@/lib/services/activityService";

export interface UnifiedPulseData {
	dock: { todayBookings: number; unreadMessages: number };
	slots: { signature: string; count: number; latest: string | null };
	onlineIds: string[];
	activity: ActivityItem[];
}

const SHARE_WINDOW_MS = 5_000;
let inflight: Promise<UnifiedPulseData | null> | null = null;
let fetchedAt = 0;

/**
 * Shared fetch for /api/v1/dashboard/unified-poll. Every component that needs
 * it calls this; calls within SHARE_WINDOW_MS reuse the same request, so N
 * subscribers still cost one invocation per poll cycle.
 */
export function fetchUnifiedPulse(): Promise<UnifiedPulseData | null> {
	if (inflight && Date.now() - fetchedAt < SHARE_WINDOW_MS) return inflight;
	fetchedAt = Date.now();
	inflight = fetch("/api/v1/dashboard/unified-poll", { cache: "no-store" })
		.then((res) => (res.ok ? res.json() : null))
		.then((body) => (body?.success ? (body.data as UnifiedPulseData) : null))
		.catch(() => null);
	return inflight;
}

