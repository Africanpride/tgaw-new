"use client";

import { useEffect, useRef } from "react";

interface UsePollingOptions {
	/** Delay between runs while the tab is visible and the user is active. */
	intervalMs: number;
	/** Stop polling after this long without user interaction (default 10 min). */
	idleAfterMs?: number;
	/** Run once immediately on mount (default true). */
	immediate?: boolean;
	/** Disable polling entirely (e.g. feature flag / signed-out). */
	enabled?: boolean;
}

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/**
 * Visibility- and idle-aware polling.
 *
 * - Never fires while the tab is hidden.
 * - Stops after `idleAfterMs` with no interaction, resumes on the next one.
 * - On return to the tab / window focus it refreshes immediately, but only if
 *   the data is at least half an interval old (prevents focus-spam).
 * - Uses a self-scheduling timeout so slow requests never overlap.
 */
export function usePolling(
	fn: () => void | Promise<void>,
	{ intervalMs, idleAfterMs = 10 * 60_000, immediate = true, enabled = true }: UsePollingOptions,
) {
	const fnRef = useRef(fn);

	// Keep the latest callback without restarting the timer on every render.
	// Ref writes belong in an effect, not in the render body.
	useEffect(() => {
		fnRef.current = fn;
	});

	useEffect(() => {
		if (!enabled) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let lastRun = 0;
		let lastActivity = Date.now();
		let running = false;

		const canRun = () =>
			document.visibilityState === "visible" && Date.now() - lastActivity < idleAfterMs;

		const schedule = () => {
			if (cancelled) return;
			if (timer) clearTimeout(timer);
			timer = setTimeout(tick, intervalMs);
		};

		const run = async () => {
			if (running) return;
			running = true;
			lastRun = Date.now();
			try {
				await fnRef.current();
			} catch {
				// transient failure — next tick retries
			} finally {
				running = false;
			}
		};

		const tick = async () => {
			if (cancelled) return;
			if (canRun()) await run();
			schedule();
		};

		const refreshIfStale = () => {
			if (cancelled || !canRun()) return;
			if (Date.now() - lastRun >= intervalMs / 2) {
				void run().then(schedule);
			}
		};

		const onActivity = () => {
			const wasIdle = Date.now() - lastActivity >= idleAfterMs;
			lastActivity = Date.now();
			if (wasIdle) refreshIfStale();
		};

		if (immediate && canRun()) void run();
		schedule();

		document.addEventListener("visibilitychange", refreshIfStale);
		window.addEventListener("focus", refreshIfStale);
		for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, onActivity, { passive: true });

		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
			document.removeEventListener("visibilitychange", refreshIfStale);
			window.removeEventListener("focus", refreshIfStale);
			for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, onActivity);
		};
	}, [intervalMs, idleAfterMs, immediate, enabled]);
}
