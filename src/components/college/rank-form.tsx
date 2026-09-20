"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { KCET_CATEGORIES, KARNATAKA_DISTRICTS, COLLEGE_TYPES } from "@/lib/constants";

export type BranchOption = { slug: string; shortName: string; name: string };

export type RankFormValues = {
  rank: string;
  category: string;
  gender: string;
  branches: string[];
  districts: string[];
  collegeTypes: string[];
  maxFee: string;
  hostelRequired: boolean;
  placementImportance: string;
};

const DEFAULTS: RankFormValues = {
  rank: "",
  category: "GM",
  gender: "ALL",
  branches: [],
  districts: [],
  collegeTypes: [],
  maxFee: "",
  hostelRequired: false,
  placementImportance: "3",
};

export function valuesToQuery(v: RankFormValues) {
  const p = new URLSearchParams();
  p.set("rank", v.rank);
  p.set("category", v.category);
  if (v.gender !== "ALL") p.set("gender", v.gender);
  if (v.branches.length) p.set("branches", v.branches.join(","));
  if (v.districts.length) p.set("districts", v.districts.join(","));
  if (v.collegeTypes.length) p.set("types", v.collegeTypes.join(","));
  if (v.maxFee) p.set("maxFee", v.maxFee);
  if (v.hostelRequired) p.set("hostel", "1");
  if (v.placementImportance !== "3") p.set("placement", v.placementImportance);
  return p.toString();
}

/** Full preference form. `compact` renders the homepage variant (rank + category + branch). */
export function RankForm({ branches, initial, compact = false }: { branches: BranchOption[]; initial?: Partial<RankFormValues>; compact?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<RankFormValues>({ ...DEFAULTS, ...initial });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RankFormValues>(k: K, val: RankFormValues[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }
  function toggleIn(k: "branches" | "districts" | "collegeTypes", val: string) {
    setV((s) => ({ ...s, [k]: s[k].includes(val) ? s[k].filter((x) => x !== val) : [...s[k], val] }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const rank = Number(v.rank.replace(/[,\s]/g, ""));
    if (!Number.isInteger(rank) || rank < 1 || rank > 300000) {
      setError("Enter a valid KCET rank between 1 and 3,00,000.");
      return;
    }
    setError(null);
    router.push(`/find?${valuesToQuery({ ...v, rank: String(rank) })}`);
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="KCET rank">
          <Input inputMode="numeric" placeholder="e.g. 18542" value={v.rank} onChange={(e) => set("rank", e.target.value)} required />
        </Field>
        <Field label="Category">
          <Select value={v.category} onChange={(e) => set("category", e.target.value)}>
            {KCET_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Preferred branch">
          <Select value={v.branches[0] ?? ""} onChange={(e) => set("branches", e.target.value ? [e.target.value] : [])}>
            <option value="">Any branch</option>
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.shortName} — {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" size="md" className="w-full sm:w-auto">
            <Search className="h-4 w-4" /> Find colleges
          </Button>
        </div>
        {error && <p className="text-sm text-danger sm:col-span-4">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="KCET rank" hint="Your overall engineering (PCM) rank from the KEA result.">
          <Input inputMode="numeric" placeholder="e.g. 18542" value={v.rank} onChange={(e) => set("rank", e.target.value)} required />
        </Field>
        <Field label="Category" hint="As printed on your KCET verification slip.">
          <Select value={v.category} onChange={(e) => set("category", e.target.value)}>
            {KCET_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender" hint="Only used where the official cutoff data is gender-specific.">
          <Select value={v.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="ALL">Not applicable / any</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Preferred branches <span className="font-normal text-muted">(leave empty for all)</span></legend>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => {
            const on = v.branches.includes(b.slug);
            return (
              <button key={b.slug} type="button" onClick={() => toggleIn("branches", b.slug)} title={b.name} className={`rounded-full border px-3 py-1 text-sm ${on ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-slate-50"}`}>
                {b.shortName}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Preferred districts <span className="font-normal text-muted">(leave empty for all of Karnataka)</span></legend>
        <div className="flex flex-wrap gap-2">
          {KARNATAKA_DISTRICTS.map((d) => {
            const on = v.districts.includes(d);
            return (
              <button key={d} type="button" onClick={() => toggleIn("districts", d)} className={`rounded-full border px-3 py-1 text-sm ${on ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-slate-50"}`}>
                {d}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="College type">
          <div className="flex flex-wrap gap-2 pt-1">
            {COLLEGE_TYPES.map((t) => {
              const on = v.collegeTypes.includes(t.value);
              return (
                <button key={t.value} type="button" onClick={() => toggleIn("collegeTypes", t.value)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-slate-50"}`}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Max annual fee (₹)" hint="KCET quota tuition + mandatory fees.">
          <Select value={v.maxFee} onChange={(e) => set("maxFee", e.target.value)}>
            <option value="">No limit</option>
            <option value="100000">Below ₹1 lakh</option>
            <option value="200000">Up to ₹2 lakh</option>
            <option value="300000">Up to ₹3 lakh</option>
          </Select>
        </Field>
        <Field label="Hostel">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={v.hostelRequired} onChange={(e) => set("hostelRequired", e.target.checked)} className="h-4 w-4 rounded border-border" />
            Hostel required
          </label>
        </Field>
        <Field label="Placement importance" hint="Nudges ordering within each group.">
          <Select value={v.placementImportance} onChange={(e) => set("placementImportance", e.target.value)}>
            <option value="1">1 — Not important</option>
            <option value="2">2</option>
            <option value="3">3 — Balanced</option>
            <option value="4">4</option>
            <option value="5">5 — Very important</option>
          </Select>
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg">
        <Search className="h-4 w-4" /> Show colleges for my rank
      </Button>
    </form>
  );
}
