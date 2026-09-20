"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import type { FieldDef } from "@/lib/admin/fields";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };
type ListResponse = { items: Row[]; total: number; page: number; pageSize: number };
type Option = { id: string; label: string; collegeId?: string };

const PAGE_SIZE = 25;

function cellValue(row: Row, col: string): React.ReactNode {
  const v = row[col];
  if (v === null || v === undefined || v === "") return <span className="text-muted">—</span>;
  if (typeof v === "boolean") return v ? <Badge tone={col === "isDemo" ? "warning" : "success"}>{col === "isDemo" ? "Demo" : "Yes"}</Badge> : <span className="text-muted">{col === "isDemo" ? "" : "No"}</span>;
  if (typeof v === "number") return /year|round|pincode/i.test(col) ? String(v) : v.toLocaleString("en-IN");
  if (v instanceof Date) return formatDate(v);
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return formatDate(v);
    return v.length > 60 ? v.slice(0, 57) + "…" : v;
  }
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return String(o.shortName ?? o.name ?? o.code ?? JSON.stringify(o));
  }
  return String(v);
}

export function ResourceManager({ resource, label, columns, fields }: { resource: string; label: string; columns: string[]; fields: FieldDef[] }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null | "new">(null);
  const loading = data === null;

  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/${resource}?q=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load");
        if (active) {
          setData(json.data);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [resource, q, page, reloadKey]);

  async function remove(row: Row) {
    if (!window.confirm(`Delete this ${label.toLowerCase()} record? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/${resource}/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert(json?.error?.message ?? "Delete failed");
      return;
    }
    load();
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${label.toLowerCase()}…`}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={load} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <span className="text-sm text-muted">{data ? `${data.total.toLocaleString("en-IN")} records` : ""}</span>
        <Button className="ml-auto" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add {label.toLowerCase().replace(/s$/, "")}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c}>{cellValue(row, c)}</td>
                  ))}
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(row)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-muted">
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
            <span className="text-muted">
              Page {data.page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <RecordEditor
          resource={resource}
          label={label}
          fields={fields}
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Editor drawer ───────────────────────── */

function useOptions(type: FieldDef["type"], collegeId?: string) {
  const [options, setOptions] = useState<Option[]>([]);
  useEffect(() => {
    let cancelled = false;
    const map: Partial<Record<FieldDef["type"], string>> = { college: "colleges", branch: "branches", department: "departments", source: "sources", recruiter: "recruiters" };
    const key = map[type];
    if (!key) return;
    const url = `/api/admin/${key}?pageSize=200${type === "department" && collegeId ? `&collegeId=${collegeId}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const items = (j.data?.items ?? []) as Row[];
        setOptions(
          items.map((i) => ({
            id: i.id,
            collegeId: i.collegeId as string | undefined,
            label: String(type === "college" ? `${i.code} — ${i.name}` : type === "branch" ? `${i.shortName} — ${i.name}` : type === "department" ? `${(i.college as Row | undefined)?.shortName ?? ""} · ${i.name}` : i.name),
          })),
        );
      })
      .catch(() => setOptions([]));
    return () => {
      cancelled = true;
    };
  }, [type, collegeId]);
  return options;
}

function RecordEditor({ resource, label, fields, row, onClose, onSaved }: { resource: string; label: string; fields: FieldDef[]; row: Row | null; onClose: () => void; onSaved: () => void }) {
  const initial = useMemo(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = row?.[f.name];
      if (f.type === "list") v[f.name] = Array.isArray(raw) ? raw.join("\n") : "";
      else if (f.type === "boolean") v[f.name] = !!raw;
      else if (f.type === "date") v[f.name] = typeof raw === "string" ? raw.slice(0, 10) : "";
      else v[f.name] = raw ?? "";
    }
    return v;
  }, [fields, row]);
  const [v, setV] = useState<Record<string, unknown>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collegeOptions = useOptions("college");
  const branchOptions = useOptions("branch");
  const departmentOptions = useOptions("department", (v.collegeId as string) || undefined);
  const sourceOptions = useOptions("source");
  const recruiterOptions = useOptions("recruiter");
  const optionsFor = (t: FieldDef["type"]) =>
    t === "college" ? collegeOptions : t === "branch" ? branchOptions : t === "department" ? departmentOptions : t === "source" ? sourceOptions : t === "recruiter" ? recruiterOptions : [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const val = v[f.name];
      if (f.type === "list") body[f.name] = String(val ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      else if (f.type === "number") body[f.name] = val === "" || val === null || val === undefined ? null : Number(val);
      else if (f.type === "boolean") body[f.name] = !!val;
      else if (f.type === "date") body[f.name] = val ? new Date(String(val)).toISOString() : null;
      else body[f.name] = val === "" ? null : val;
    }
    // required text fields must not be null
    for (const f of fields) if (f.required && (body[f.name] === null || body[f.name] === undefined)) delete body[f.name];
    try {
      const res = await fetch(row ? `/api/admin/${resource}/${row.id}` : `/api/admin/${resource}`, {
        method: row ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const issues = json?.error?.details;
        setError(Array.isArray(issues) && issues.length ? issues.map((i: { path?: (string | number)[]; message: string }) => `${(i.path ?? []).join(".")}: ${i.message}`).join("; ") : json?.error?.message ?? "Save failed");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold">
            {row ? "Edit" : "Add"} {label.toLowerCase().replace(/s$/, "")}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {fields.map((f) => {
            const val = v[f.name];
            const set = (x: unknown) => setV((s) => ({ ...s, [f.name]: x }));
            const relOptions = optionsFor(f.type);
            return (
              <Field key={f.name} label={`${f.label}${f.required ? " *" : ""}`} hint={f.hint}>
                {f.type === "textarea" || f.type === "list" ? (
                  <Textarea value={String(val ?? "")} onChange={(e) => set(e.target.value)} />
                ) : f.type === "boolean" ? (
                  <label className="flex h-10 items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!val} onChange={(e) => set(e.target.checked)} className="h-4 w-4" /> Yes
                  </label>
                ) : f.type === "select" ? (
                  <Select value={String(val ?? "")} onChange={(e) => set(e.target.value)} required={f.required}>
                    {!f.required && <option value="">—</option>}
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : relOptions.length || ["college", "branch", "department", "source", "recruiter"].includes(f.type) ? (
                  <Select value={String(val ?? "")} onChange={(e) => set(e.target.value)} required={f.required}>
                    <option value="">{f.required ? "Select…" : "—"}</option>
                    {relOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"} step={f.type === "number" ? "any" : undefined} value={String(val ?? "")} onChange={(e) => set(e.target.value)} required={f.required} />
                )}
              </Field>
            );
          })}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
