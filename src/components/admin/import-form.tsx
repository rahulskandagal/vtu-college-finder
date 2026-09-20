"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Field, Select } from "@/components/ui";

type Summary = {
  mode: "validate" | "import";
  total: number;
  valid: number;
  invalid: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  errors: { rowNumber: number; field?: string; message: string }[];
  preview: Record<string, unknown>[];
  imported?: number;
  updated?: number;
  skipped?: number;
  status?: string;
};

export function ImportForm({ sources }: { sources: { id: string; name: string; isDemo: boolean }[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState<"validate" | "import" | null>(null);
  const [result, setResult] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: "validate" | "import") {
    if (!file) return;
    setBusy(mode);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("mode", mode);
    if (sourceId) fd.set("sourceId", sourceId);
    fd.set("isDemo", String(isDemo));
    fd.set("overwrite", String(overwrite));
    try {
      const res = await fetch("/api/admin/cutoffs/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Import failed");
      setResult(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <Field label="File (.csv, .xlsx, .xls)">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Source" hint="Attach the KEA document / page these cutoffs come from.">
              <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                <option value="">— none —</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.isDemo ? " (demo)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Flag as demo data">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} className="h-4 w-4" /> Yes, this is sample data
              </label>
            </Field>
            <Field label="Existing rows">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="h-4 w-4" /> Overwrite duplicates
              </label>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!file || !!busy} onClick={() => run("validate")}>
              {busy === "validate" ? "Validating…" : "Validate only"}
            </Button>
            <Button disabled={!file || !!busy || !result || result.valid === 0} onClick={() => run("import")}>
              <Upload className="h-4 w-4" /> {busy === "import" ? "Importing…" : `Import ${result?.valid ?? ""} valid rows`}
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader
            title={result.mode === "import" ? "Import result" : "Validation result"}
            action={result.status ? <Badge tone={result.status === "SUCCESS" ? "success" : result.status === "PARTIAL" ? "warning" : "danger"}>{result.status}</Badge> : undefined}
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <div><p className="text-xs text-muted">Rows in file</p><p className="text-lg font-semibold">{result.total}</p></div>
              <div><p className="text-xs text-muted">Valid</p><p className="text-lg font-semibold text-success">{result.valid}</p></div>
              <div><p className="text-xs text-muted">Invalid</p><p className="text-lg font-semibold text-danger">{result.invalid}</p></div>
              <div><p className="text-xs text-muted">Duplicates in file</p><p className="text-lg font-semibold">{result.duplicatesInFile}</p></div>
              <div><p className="text-xs text-muted">Already in database</p><p className="text-lg font-semibold">{result.duplicatesInDb}</p></div>
            </div>
            {result.mode === "import" && (
              <p className="mt-3 text-sm">
                Imported <strong>{result.imported}</strong> new rows, updated <strong>{result.updated}</strong>, skipped <strong>{result.skipped}</strong>.
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium">Problems ({result.errors.length}{result.errors.length >= 200 ? "+" : ""})</p>
                <div className="max-h-64 overflow-y-auto rounded border border-border">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Field</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td>{e.rowNumber}</td>
                          <td>{e.field ?? "—"}</td>
                          <td>{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {result.preview.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium">Preview of valid rows</p>
                <div className="scroll-x rounded border border-border">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(result.preview[0]).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.preview.map((r, i) => (
                        <tr key={i}>
                          {Object.values(r).map((v, j) => (
                            <td key={j}>{String(v ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
