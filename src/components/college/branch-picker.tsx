"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Select } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { KCET_CATEGORIES } from "@/lib/constants";

type Option = { slug: string; shortName: string; name: string };

export function BranchPicker({ options, selected, category }: { options: Option[]; selected: string[]; category: string }) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([...selected, "", "", "", ""].slice(0, 4));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const chosen = Array.from(new Set(slugs.filter(Boolean)));
    router.push(`/compare/branches?b=${chosen.join(",")}&category=${category}`);
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      {slugs.map((s, i) => (
        <label key={i} className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Branch {i + 1}</span>
          <Select className="w-56" value={s} onChange={(e) => setSlugs((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))}>
            <option value="">—</option>
            {options.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.shortName} — {a.name}
              </option>
            ))}
          </Select>
        </label>
      ))}
      <Button type="submit">Compare</Button>
      <div className="ml-auto">
        <span className="mb-1 block text-xs font-medium text-slate-700">Category</span>
        <AutoSubmitSelect param="category" defaultValue={category} className="w-32" aria-label="Category">
          {KCET_CATEGORIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>
    </form>
  );
}
