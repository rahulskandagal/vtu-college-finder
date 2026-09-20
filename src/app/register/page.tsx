import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create your student account</h1>
        <p className="mb-5 mt-1 text-sm text-muted">Save your KCET rank and preferences, shortlist colleges and keep comparisons.</p>
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </Container>
  );
}
