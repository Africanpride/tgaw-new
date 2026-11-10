"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedPoll } from "@/providers/UnifiedPollProvider";

/**
 * Watches for slot changes affecting the signed-in user and keeps their open
 * views fresh without a manual reload.
 *
 * - Consumes the shared unified poll (180 s interval, visibility/idle-aware).
 * - When the "my upcoming bookings" signature changes, calls router.refresh()
 *   and fires a window "slots:changed" event so client pages can refetch.
 *
 * Mounted once in the dashboard layout; emits nothing visible on its own.
 */
export function SlotSyncListener() {
	const router = useRouter();
	const { data } = useUnifiedPoll();
	const lastSignature = useRef<string | null>(null);

	useEffect(() => {
		if (!data?.slots) return;
		const signature = data.slots.signature;
		if (lastSignature.current === null) {
			lastSignature.current = signature; // seed baseline, don't refresh
			return;
		}
		if (signature !== lastSignature.current) {
			lastSignature.current = signature;
			router.refresh();
			window.dispatchEvent(new Event("slots:changed"));
		}
	}, [data, router]);

	return null;
}
