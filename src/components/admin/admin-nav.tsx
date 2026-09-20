"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui";

type Item = { key: string; label: string; group: string };

export function AdminNav({ items, mobile = false }: { items: Item[]; mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  if (mobile) {
    return (
      <Select value={pathname} onChange={(e) => router.push(e.target.value)} aria-label="Admin section">
        <option value="/admin">Overview</option>
        <option value="/admin/import">Import cutoffs</option>
        {items.map((i) => (
          <option key={i.key} value={`/admin/${i.key}`}>
            {i.group} · {i.label}
          </option>
        ))}
      </Select>
    );
  }
  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <nav className="mt-2 space-y-3">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</p>
          {items
            .filter((i) => i.group === g)
            .map((i) => {
              const href = `/admin/${i.key}`;
              return (
                <Link key={i.key} href={href} className={cn("block rounded-md px-2 py-1.5 text-sm hover:bg-slate-100", pathname === href ? "bg-primary-soft text-primary" : "")}>
                  {i.label}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
