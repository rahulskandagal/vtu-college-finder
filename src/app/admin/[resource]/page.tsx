import { notFound } from "next/navigation";
import { ADMIN_FIELDS, ADMIN_NAV } from "@/lib/admin/fields";
import { getResource } from "@/lib/admin/registry";
import { ResourceManager } from "@/components/admin/resource-manager";
import { PageHeader } from "@/components/ui";

export default async function AdminResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = getResource(resource);
  const fields = ADMIN_FIELDS[resource];
  if (!def || !fields) notFound();
  const nav = ADMIN_NAV.find((n) => n.key === resource);
  return (
    <div>
      <PageHeader title={def.label} description={`${nav?.group ?? ""} · add, edit, search and delete ${def.label.toLowerCase()} records.`} />
      <ResourceManager resource={resource} label={def.label} columns={def.columns} fields={fields} />
    </div>
  );
}
