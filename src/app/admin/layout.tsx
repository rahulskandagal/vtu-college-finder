import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ADMIN_NAV } from "@/lib/admin/fields";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard?denied=admin");

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 rounded-xl border border-border bg-card p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Admin</p>
          <Link href="/admin" className="block rounded-md px-2 py-1.5 text-sm hover:bg-slate-100">Overview</Link>
          <Link href="/admin/import" className="block rounded-md px-2 py-1.5 text-sm hover:bg-slate-100">Import cutoffs (CSV/Excel)</Link>
          <AdminNav items={ADMIN_NAV} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <AdminNav items={ADMIN_NAV} mobile />
        </div>
        {children}
      </div>
    </div>
  );
}
