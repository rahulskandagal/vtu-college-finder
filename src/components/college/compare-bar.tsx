"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "./compare-store";
import { buttonClass } from "@/components/ui";
import { MAX_COMPARE } from "@/lib/constants";

/** Sticky tray that shows colleges selected for comparison. */
export function CompareBar() {
  const { entries, remove, clear } = useCompare();
  const pathname = usePathname();
  if (entries.length === 0 || pathname.startsWith("/compare") || pathname.startsWith("/admin")) return null;
  const href = `/compare?c=${entries.map((e) => e.slug).join(",")}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <span className="text-sm font-medium">
          Compare ({entries.length}/{MAX_COMPARE})
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {entries.map((e) => (
            <span key={e.slug} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs">
              {e.name}
              <button type="button" onClick={() => remove(e.slug)} aria-label={`Remove ${e.name}`} className="rounded p-0.5 hover:bg-slate-200">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <button type="button" onClick={clear} className={buttonClass("ghost", "sm")}>
          Clear
        </button>
        <Link href={href} className={buttonClass("primary", "sm", entries.length < 2 ? "pointer-events-none opacity-50" : "")} aria-disabled={entries.length < 2}>
          Compare now
        </Link>
      </div>
    </div>
  );
}
