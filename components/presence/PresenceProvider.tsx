"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

const HEARTBEAT_MS = 60_000;
const LIST_REFRESH_MS = 90_000;

const PresenceContext = createContext<ReadonlySet<string>>(new Set());

/** The set of user ids currently online (heartbeated within the TTL window). */
export function useOnlineUserIds(): ReadonlySet<string> {
	return useContext(PresenceContext);
}

/**
 * Mounted once in the dashboard layout. Heartbeats this tab's session every
 * minute while visible, and polls the online list on an interval + window
 * focus. Visibility-aware so hidden tabs cost nothing.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
	const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(new Set());

	// Heartbeat
	useEffect(() => {
		let stopped = false;

		const beat = () => {
			if (!stopped && document.visibilityState === "visible") {
				fetch("/api/v1/presence/heartbeat", { method: "POST" }).catch(() => {});
			}
		};

		beat();
		const interval = setInterval(beat, HEARTBEAT_MS);
		const onVisibility = () => {
			if (document.visibilityState === "visible") beat();
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			stopped = true;
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	// Online list
	useEffect(() => {
		let stopped = false;

		const load = () => {
			fetch("/api/v1/presence")
				.then((res) => res.json())
				.then((body) => {
					if (!stopped && body?.success) {
						setOnlineIds(
							new Set(
								(body.data as Array<{ id: string }>).map((u) => u.id),
							),
						);
					}
				})
				.catch(() => {});
		};

		load();
		const interval = setInterval(load, LIST_REFRESH_MS);
		window.addEventListener("focus", load);

		return () => {
			stopped = true;
			clearInterval(interval);
			window.removeEventListener("focus", load);
		};
	}, []);

	return (
		<PresenceContext.Provider value={onlineIds}>
			{children}
		</PresenceContext.Provider>
	);
}
