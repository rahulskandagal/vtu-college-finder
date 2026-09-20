"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, BookmarkCheck, GitCompare, Check } from "lucide-react";
import { useCompare } from "./compare-store";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CompareToggle({ slug, name, size = "sm", className }: { slug: string; name: string; size?: "sm" | "md"; className?: string }) {
  const { has, toggle, isFull } = useCompare();
  const selected = has(slug);
  const disabled = !selected && isFull;
  return (
    <button
      type="button"
      onClick={() => toggle({ slug, name })}
      disabled={disabled}
      title={disabled ? "You can compare up to 4 colleges" : selected ? "Remove from compare" : "Add to compare"}
      className={buttonClass(selected ? "secondary" : "outline", size, className)}
    >
      {selected ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
      {selected ? "Comparing" : "Compare"}
    </button>
  );
}

export function ShortlistButton({
  collegeId,
  initiallySaved = false,
  size = "sm",
  className,
}: {
  collegeId: string;
  initiallySaved?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = saved
        ? await fetch(`/api/shortlist/${collegeId}`, { method: "DELETE" })
        : await fetch("/api/shortlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collegeId }) });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (res.ok) setSaved(!saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className={cn(buttonClass(saved ? "secondary" : "outline", size), className)} title={saved ? "Remove from shortlist" : "Add to shortlist"}>
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Shortlisted" : "Shortlist"}
    </button>
  );
}
