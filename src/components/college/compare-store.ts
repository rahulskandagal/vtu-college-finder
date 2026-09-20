"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { COMPARE_STORAGE_KEY, MAX_COMPARE } from "@/lib/constants";

export type CompareEntry = { slug: string; name: string };

const EVENT = "vcf-compare-change";

function read(): CompareEntry[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CompareEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

function write(entries: CompareEntry[]) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function getSnapshot() {
  try {
    return localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
const getServerSnapshot = () => "[]";

/** Small localStorage-backed store for the "compare" tray, shared across components. */
export function useCompare() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const entries = useMemo<CompareEntry[]>(() => {
    try {
      const parsed = JSON.parse(raw) as CompareEntry[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const has = useCallback((slug: string) => entries.some((e) => e.slug === slug), [entries]);

  const toggle = useCallback((entry: CompareEntry) => {
    const cur = read();
    const next = cur.some((e) => e.slug === entry.slug)
      ? cur.filter((e) => e.slug !== entry.slug)
      : cur.length >= MAX_COMPARE
        ? cur
        : [...cur, entry];
    write(next);
    return next.some((e) => e.slug === entry.slug);
  }, []);

  const remove = useCallback((slug: string) => write(read().filter((e) => e.slug !== slug)), []);
  const clear = useCallback(() => write([]), []);

  return { entries, has, toggle, remove, clear, isFull: entries.length >= MAX_COMPARE };
}
