"use client";

import { ReactNode, useEffect } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supa: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
	if (!supa) {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL
		const key =
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

		if (!url || !key) {
			if (process.env.NODE_ENV !== "production") {
				console.warn(
					"[Supabase] Realtime disabled: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set."
				)
			}
			return null
		}

		try {
			supa = createClient(url, key)
		} catch (err) {
			console.error("[Supabase] Failed to initialize client:", err)
			return null
		}
	}
	return supa
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
	const supa = getSupabase()

	useEffect(() => {
		// no-op; channels are opened per-component
	}, [supa])

	return <>{children}</>
}