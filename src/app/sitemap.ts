import type { MetadataRoute } from "next";
import { getAllCollegeSlugs } from "@/lib/data/colleges";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticPages = ["", "/find", "/colleges", "/cutoffs", "/branches", "/compare", "/compare/branches", "/campus-life", "/placements", "/events", "/hackathons", "/clubs", "/kcet-guide"];
  const [colleges, branches] = await Promise.all([getAllCollegeSlugs(), prisma.branch.findMany({ select: { slug: true, updatedAt: true } })]);
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...colleges.map((c) => ({ url: `${base}/college/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...colleges.flatMap((c) => c.branches.map((b) => ({ url: `${base}/college/${c.slug}/${b.branch.slug}`, lastModified: c.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }))),
    ...branches.map((b) => ({ url: `${base}/branches/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
