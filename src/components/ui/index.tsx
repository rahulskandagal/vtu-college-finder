import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, Database, Info } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { DEMO_NOTICE, DISCLAIMER } from "@/lib/constants";

/* ───────────────────────── Buttons ───────────────────────── */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  secondary: "bg-primary-soft text-primary hover:bg-blue-200",
  outline: "border border-border bg-card text-foreground hover:bg-slate-50",
  ghost: "text-foreground hover:bg-slate-100",
  danger: "bg-danger text-white hover:bg-red-800",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ───────────────────────── Cards & layout ───────────────────────── */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)} {...props} />;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function PageHeader({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-lg font-semibold", className)}>{children}</h2>;
}

/* ───────────────────────── Badges ───────────────────────── */

type BadgeTone = "neutral" | "primary" | "accent" | "warning" | "danger" | "success";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap", badgeTones[tone], className)}
      {...props}
    />
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warning" className={className} title={DEMO_NOTICE}>
      Demo data
    </Badge>
  );
}

export function DemoBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-amber-200 bg-warning-soft px-4 py-3 text-sm text-amber-900", className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{DEMO_NOTICE}</p>
    </div>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700", className)}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}

/* ───────────────────────── Sources ───────────────────────── */

export type SourceLike = {
  name: string;
  url?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  lastVerifiedAt?: Date | string | null;
  isDemo?: boolean;
} | null | undefined;

export function SourceNote({ source, updatedAt, className }: { source: SourceLike; updatedAt?: Date | string | null; className?: string }) {
  if (!source) {
    return <p className={cn("text-xs text-muted", className)}>Source: not recorded</p>;
  }
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1 text-xs text-muted", className)}>
      <Database className="h-3 w-3" />
      <span>Source:</span>
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {source.name}
        </a>
      ) : (
        <span>{source.name}</span>
      )}
      {source.publicationYear && <span>· {source.publicationYear}</span>}
      {source.lastVerifiedAt && <span>· verified {formatDate(source.lastVerifiedAt)}</span>}
      {updatedAt && <span>· updated {formatDate(updatedAt)}</span>}
      {source.isDemo && <DemoBadge className="ml-1" />}
    </p>
  );
}

/* ───────────────────────── Empty / stats ───────────────────────── */

export function EmptyState({ title = "Data currently unavailable", description, className }: { title?: string; description?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-slate-50 px-6 py-8 text-center", className)}>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card px-4 py-3", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{it.label}</dt>
          <dd className="text-sm">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────────────────── Form controls ───────────────────────── */

const controlClass =
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClass, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "h-auto min-h-24 py-2", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ───────────────────────── Pagination ───────────────────────── */

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
      <span className="text-muted">
        Page {page} of {pages} · {total} results
      </span>
      <div className="flex gap-2">
        <Link aria-disabled={page <= 1} className={buttonClass("outline", "sm", page <= 1 ? "pointer-events-none opacity-50" : "")} href={hrefFor(Math.max(1, page - 1))}>
          Previous
        </Link>
        <Link aria-disabled={page >= pages} className={buttonClass("outline", "sm", page >= pages ? "pointer-events-none opacity-50" : "")} href={hrefFor(Math.min(pages, page + 1))}>
          Next
        </Link>
      </div>
    </nav>
  );
}
