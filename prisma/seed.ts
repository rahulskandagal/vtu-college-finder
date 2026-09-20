/**
 * Default seed: creates the admin + demo student accounts, reference sources,
 * and imports the official KEA cut-off documents from data/kea/*.json
 * (see scripts/parse_kea_cutoff_pdf.py and prisma/import-kea.ts).
 *
 * All imported data is real, sourced and flagged isDemo = false.
 * For illustrative demo records (fees, placements, faculty…) run
 * `npx tsx prisma/seed-demo.ts` — those are flagged isDemo = true.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Platform Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12) },
  });
  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: { email: "student@example.com", name: "Demo Student", role: "STUDENT", passwordHash: await bcrypt.hash("Student@123", 12) },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, kcetRank: 18542, category: "GM", preferredBranches: ["computer-science-engineering", "artificial-intelligence-machine-learning"], preferredDistricts: ["Shivamogga", "Mysuru"], hostelRequired: true, placementImportance: 4 },
  });
  for (const s of [
    { id: "src_kea", name: "KEA — Karnataka Examinations Authority (official portal)", url: "https://cetonline.karnataka.gov.in/kea/", publisher: "KEA" },
    { id: "src_vtu", name: "VTU — Visvesvaraya Technological University", url: "https://vtu.ac.in/", publisher: "VTU" },
  ]) {
    await prisma.source.upsert({ where: { id: s.id }, update: {}, create: { ...s, publicationYear: 2026 } });
  }
  console.log(`Users ready. Admin: ${adminEmail} / ${adminPassword} · Student: student@example.com / Student@123`);
  await prisma.$disconnect();

  console.log("Importing KEA cut-off documents…");
  execFileSync(process.execPath, [path.join(__dirname, "..", "node_modules", "tsx", "dist", "cli.mjs"), path.join(__dirname, "import-kea.ts")], { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
