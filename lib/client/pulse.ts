import { fetchUnifiedPulse, type UnifiedPulseData } from "./unifiedPulse";

export interface PulseData {
	dock: { todayBookings: number; unreadMessages: number };
	slots: { signature: string; count: number; latest: string | null };
}

/**
 * Backwards compatibility wrapper: delegates to the unified pulse client.
 */
export async function fetchPulse(): Promise<PulseData | null> {
	const data = await fetchUnifiedPulse();
	if (!data) return null;
	return {
		dock: data.dock,
		slots: data.slots,
	};
}
