"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { COLLEGE_TYPES, KARNATAKA_DISTRICTS, KCET_CATEGORIES } from "@/lib/constants";

type Branch = { slug: string; shortName: string; name: string };
export type ProfileInitial = {
  kcetRank: number | null;
  category: string | null;
  gender: string | null;
  preferredBranches: string[];
  preferredDistricts: string[];
  budgetMax: number | null;
  hostelRequired: boolean;
  placementImportance: number;
  collegeTypePref: string | null;
} | null;

export function ProfileForm({ branches, initial }: { branches: Branch[]; initial: ProfileInitial }) {
  const router = useRouter();
  const [v, setV] = useState({
    kcetRank: initial?.kcetRank ? String(initial.kcetRank) : "",
    category: initial?.category ?? "GM",
    gender: initial?.gender ?? "ALL",
    preferredBranches: initial?.preferredBranches ?? [],
    preferredDistricts: initial?.preferredDistricts ?? [],
    budgetMax: initial?.budgetMax ? String(initial.budgetMax) : "",
    hostelRequired: initial?.hostelRequired ?? false,
    placementImportance: String(initial?.placementImportance ?? 3),
    collegeTypePref: initial?.collegeTypePref ?? "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (k: "preferredBranches" | "preferredDistricts", val: string) =>
    setV((s) => ({ ...s, [k]: s[k].includes(val) ? s[k].filter((x) => x !== val) : [...s[k], val] }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/student/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kcetRank: v.kcetRank ? Number(v.kcetRank.replace(/[,\s]/g, "")) : null,
        category: v.category,
        gender: v.gender,
        preferredBranches: v.preferredBranches,
        preferredDistricts: v.preferredDistricts,
        budgetMax: v.budgetMax ? Number(v.budgetMax) : null,
        hostelRequired: v.hostelRequired,
        placementImportance: Number(v.placementImportance),
        collegeTypePref: v.collegeTypePref || null,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(json?.error?.details?.[0]?.message ?? json?.error?.message ?? "Could not save");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="KCET rank">
        <Input inputMode="numeric" value={v.kcetRank} onChange={(e) => setV({ ...v, kcetRank: e.target.value })} placeholder="e.g. 18542" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
            {KCET_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender">
          <Select value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value })}>
            <option value="ALL">Any</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
        </Field>
      </div>
      <Field label="Preferred branches">
        <div className="flex flex-wrap gap-1.5">
          {branches.map((b) => (
            <button key={b.slug} type="button" title={b.name} onClick={() => toggle("preferredBranches", b.slug)} className={`rounded-full border px-2.5 py-0.5 text-xs ${v.preferredBranches.includes(b.slug) ? "border-primary bg-primary-soft text-primary" : "border-border"}`}>
              {b.shortName}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Preferred districts">
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
          {KARNATAKA_DISTRICTS.map((d) => (
            <button key={d} type="button" onClick={() => toggle("preferredDistricts", d)} className={`rounded-full border px-2.5 py-0.5 text-xs ${v.preferredDistricts.includes(d) ? "border-primary bg-primary-soft text-primary" : "border-border"}`}>
              {d}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Max fee / year (₹)">
          <Input inputMode="numeric" value={v.budgetMax} onChange={(e) => setV({ ...v, budgetMax: e.target.value })} placeholder="e.g. 150000" />
        </Field>
        <Field label="College type">
          <Select value={v.collegeTypePref} onChange={(e) => setV({ ...v, collegeTypePref: e.target.value })}>
            <option value="">Any</option>
            {COLLEGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Placement importance">
          <Select value={v.placementImportance} onChange={(e) => setV({ ...v, placementImportance: e.target.value })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hostel">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={v.hostelRequired} onChange={(e) => setV({ ...v, hostelRequired: e.target.checked })} className="h-4 w-4" /> Required
          </label>
        </Field>
      </div>
      {msg && <p className={`text-sm ${msg === "Saved." ? "text-success" : "text-danger"}`}>{msg}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
