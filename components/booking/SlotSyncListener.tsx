"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 8000;

interface ChangedResponse {
	success: boolean;
	data?: { signature: string };
	error?: unknown;
}

/**
 * Watches for slot changes affecting the signed-in user and keeps their open
 * views fresh without a manual reload.
 *
 * - Polls /api/v1/slots/changed every few seconds while the tab is visible.
 * - When the "my upcoming bookings" signature changes, calls router.refresh()
 *   (re-renders the Server Components, e.g. overview + calendar) and fires a
 *   window "slots:changed" event so client pages (e.g. /booking) can refetch.
 * - Re-checks immediately on window focus to catch anything missed while the
 *   tab was backgrounded.
 *
 * Mounted once in the dashboard layout; emits nothing visible on its own.
 */
export function SlotSyncListener() {
	const router = useRouter();
	const lastSignature = useRef<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const notify = useCallback(() => {
		router.refresh();
		window.dispatchEvent(new Event("slots:changed"));
	}, [router]);

	const poll = useCallback(async () => {
		try {
			const res = await fetch("/api/v1/slots/changed", {
				cache: "no-store",
			});
			const data = (await res.json()) as ChangedResponse;
			if (!data.success || !data.data) return;

			const signature = data.data.signature;
			if (lastSignature.current === null) {
				// First poll: seed the baseline, don't refresh.
				lastSignature.current = signature;
				return;
			}
			if (signature !== lastSignature.current) {
				lastSignature.current = signature;
				notify();
			}
		} catch {
			// Transient network failure — try again next tick.
		}
	}, [notify]);

	useEffect(() => {
		let cancelled = false;

		const tick = async () => {
			if (cancelled) return;
			await poll();
			if (cancelled) return;
			timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
		};

		const onFocus = () => {
			if (document.visibilityState === "visible") {
				void poll();
			}
		};

		window.addEventListener("focus", onFocus);
		document.addEventListener("visibilitychange", onFocus);
		void tick();

		return () => {
			cancelled = true;
			if (timerRef.current) clearTimeout(timerRef.current);
			window.removeEventListener("focus", onFocus);
			document.removeEventListener("visibilitychange", onFocus);
		};
	}, [poll]);

	return null;
}