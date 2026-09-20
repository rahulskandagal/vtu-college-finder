"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { useCompare } from "./compare-store";
import { MAX_COMPARE } from "@/lib/constants";

type Option = { slug: string; name: string; shortName: string | null; district: string };

/** Select up to four colleges; keeps the URL (?c=) and the localStorage tray in sync. */
export function ComparePicker({ options, selected }: { options: Option[]; selected: string[] }) {
  const router = useRouter();
  const store = useCompare();
  const [slugs, setSlugs] = useState<string[]>(selected);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // If the URL has no selection but the tray does, use the tray.
  useEffect(() => {
    if (selected.length === 0 && store.entries.length >= 2) {
      router.replace(`/compare?c=${store.entries.map((e) => e.slug).join(",")}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.entries.length]);

  function apply(next: string[]) {
    setSlugs(next);
    router.push(next.length ? `/compare?c=${next.join(",")}` : "/compare");
  }

  async function saveComparison() {
    const name = window.prompt("Name this comparison", slugs.map((s) => options.find((o) => o.slug === s)?.shortName ?? s).join(" vs "));
    if (!name) return;
    const ids = await Promise.all(slugs.map((s) => fetch(`/api/colleges/${s}`).then((r) => r.json()).then((j) => j.data?.id as string | undefined)));
    const res = await fetch("/api/comparisons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, collegeIds: ids.filter(Boolean) }) });
    if (res.status === 401) {
      router.push("/login?next=/compare");
      return;
    }
    setSaveMsg(res.ok ? "Saved to your dashboard." : "Could not save comparison.");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {slugs.map((s) => {
          const o = options.find((x) => x.slug === s);
          return (
            <span key={s} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-sm text-primary">
              {o?.shortName ?? o?.name ?? s}
              <button type="button" aria-label="Remove" onClick={() => apply(slugs.filter((x) => x !== s))} className="rounded p-0.5 hover:bg-blue-200">
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        {slugs.length < MAX_COMPARE && (
          <Select
            className="h-9 w-72"
            value=""
            onChange={(e) => {
              if (e.target.value && !slugs.includes(e.target.value)) apply([...slugs, e.target.value]);
            }}
            aria-label="Add college"
          >
            <option value="">+ Add a college…</option>
            {options
              .filter((o) => !slugs.includes(o.slug))
              .map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name} ({o.district})
                </option>
              ))}
          </Select>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveMsg && <span className="text-xs text-muted">{saveMsg}</span>}
          <Button variant="outline" size="sm" onClick={saveComparison} disabled={slugs.length < 2}>
            Save comparison
          </Button>
          {slugs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { store.clear(); apply([]); }}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
