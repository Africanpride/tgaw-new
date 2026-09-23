"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";

interface TranslationConfigResponse {
  success: boolean;
  data: {
    enabledLocales: Locale[];
    config: { enableFr: boolean; enableEs: boolean; enablePt: boolean };
  };
}

// --- singleton shared state ---
let cache: Locale[] = ["en"];
let loading = true;
let fetched = false;
let fetchPromise: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function emitChange() {
  for (const fn of subscribers) fn();
}

async function fetchLocales() {
  try {
    const res = await fetch("/api/v1/config/translations");
    const json: TranslationConfigResponse = await res.json();
    if (json.success) cache = json.data.enabledLocales;
  } catch {
    // fall back to English-only
  } finally {
    loading = false;
    fetched = true;
    emitChange();
  }
}

function refetch() {
  if (!fetchPromise) {
    fetchPromise = fetchLocales().finally(() => { fetchPromise = null; });
  }
  return fetchPromise;
}

export function useEnabledLocales(): { locales: Locale[]; isLoading: boolean; mutate: () => void } {
  const [, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const subscribe = () => {
      if (mounted.current) setTick((t) => t + 1);
    };
    subscribers.add(subscribe);

    if (!fetched) refetch();

    return () => {
      mounted.current = false;
      subscribers.delete(subscribe);
    };
  }, []);

  return { locales: cache, isLoading: loading, mutate: useCallback(() => { refetch(); }, []) };
}
