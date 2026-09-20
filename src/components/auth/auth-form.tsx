"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) {
        const issues = json?.error?.details;
        setError(Array.isArray(issues) && issues[0]?.message ? issues[0].message : json?.error?.message ?? "Something went wrong");
        return;
      }
      const role = json.data?.role;
      router.push(next && next.startsWith("/") ? next : role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <Field label="Full name">
          <Input name="name" required minLength={2} autoComplete="name" />
        </Field>
      )}
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" hint={mode === "register" ? "At least 8 characters with a letter and a number." : undefined}>
        <Input name="password" type="password" required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
