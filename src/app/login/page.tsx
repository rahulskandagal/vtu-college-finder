import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mb-5 mt-1 text-sm text-muted">Access your saved rank, shortlist and comparisons.</p>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
        <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-muted">
          Demo accounts (seeded): <span className="font-mono">student@example.com / Student@123</span> and the admin credentials from your <span className="font-mono">.env</span>.
        </p>
      </div>
    </Container>
  );
}
