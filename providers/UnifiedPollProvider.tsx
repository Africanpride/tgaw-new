"use client";

import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { usePolling } from "@/hooks/usePolling";
import { fetchUnifiedPulse, type UnifiedPulseData } from "@/lib/client/unifiedPulse";

const POLL_INTERVAL_MS = 180_000; // 3 minutes (reduced from 60s across 5 endpoints)

interface UnifiedPollContextValue {
	data: UnifiedPulseData | null;
	/** Epoch ms of the last successful poll — lets consumers compute recency
	 *  without reading the clock during render. */
	fetchedAt: number | null;
	refetch: () => Promise<void>;
}

const UnifiedPollContext = createContext<UnifiedPollContextValue>({
	data: null,
	fetchedAt: null,
	refetch: async () => {},
});

export function useUnifiedPoll(): UnifiedPollContextValue {
	return useContext(UnifiedPollContext);
}

/** Convenience hook for online presence dots — returns set of online user IDs. */
export function useOnlineUserIds(): ReadonlySet<string> {
	const { data } = useUnifiedPoll();
	return data?.onlineIds ? new Set(data.onlineIds) : new Set<string>();
}

/**
 * Mounted once in the dashboard layout.
 * Polls the unified endpoint every 3 minutes (visibility/idle-aware via usePolling)
 * and delivers dock counts, slot signatures, presence IDs, and community activity
 * to all dashboard components in a single consolidated request.
 */
export function UnifiedPollProvider({ children }: { children: ReactNode }) {
	const [data, setData] = useState<UnifiedPulseData | null>(null);
	const [fetchedAt, setFetchedAt] = useState<number | null>(null);

	const sync = useCallback(async () => {
		const pulse = await fetchUnifiedPulse();
		if (pulse) {
			setData(pulse);
			setFetchedAt(Date.now());
		}
	}, []);

	usePolling(sync, { intervalMs: POLL_INTERVAL_MS });

	return (
		<UnifiedPollContext.Provider value={{ data, fetchedAt, refetch: sync }}>
			{children}
		</UnifiedPollContext.Provider>
	);
}

