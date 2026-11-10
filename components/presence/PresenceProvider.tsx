"use client";

import type { ReactNode } from "react";
export { useOnlineUserIds } from "@/providers/UnifiedPollProvider";

/**
 * PresenceProvider is now a transparent pass-through:
 * Online presence heartbeats and online user list polls have been
 * unified into the single UnifiedPollProvider mounted in the dashboard layout.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
