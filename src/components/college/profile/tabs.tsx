import Link from "next/link";
import type { CollegeProfile } from "@/lib/data/colleges";
import type { CutoffRow } from "@/lib/data/cutoffs";
import type { CutoffStats } from "@/lib/cutoff-engine";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./overview";
import { BranchesTab } from "./branches";
import { CutoffsTab } from "./cutoffs";
import { FeesTab } from "./fees";
import { PlacementsTab } from "./placements";
import { FacultyTab } from "./faculty";
import { CampusTab, LabsTab, HostelTab } from "./campus";
import { ClubsTab, EventsTab, HackathonsTab, StudentLifeTab } from "./student-life";
import { HistoryTab } from "./history";

export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "branches", label: "Branches" },
  { key: "cutoffs", label: "Cutoffs" },
  { key: "fees", label: "Fees" },
  { key: "placements", label: "Placements" },
  { key: "faculty", label: "Faculty" },
  { key: "campus", label: "Campus" },
  { key: "labs", label: "Labs" },
  { key: "hostel", label: "Hostel" },
  { key: "clubs", label: "Clubs" },
  { key: "events", label: "Events" },
  { key: "hackathons", label: "Hackathons" },
  { key: "student-life", label: "Student Life" },
  { key: "history", label: "History" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export type BranchStat = { branchId: string; branch: { slug: string; shortName: string; name: string }; stats: CutoffStats };

export function ProfileTabs({ college, tab, cutoffs, branchStats }: { college: CollegeProfile; tab: TabKey; cutoffs: CutoffRow[]; branchStats: BranchStat[] }) {
  return (
    <div>
      <nav className="scroll-x -mx-4 mb-6 border-b border-border px-4 sm:mx-0 sm:px-0" aria-label="College sections">
        <ul className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <li key={t.key}>
              <Link
                href={`/college/${college.slug}${t.key === "overview" ? "" : `?tab=${t.key}`}`}
                scroll={false}
                className={cn(
                  "block border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-foreground",
                )}
                aria-current={tab === t.key ? "page" : undefined}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "overview" && <OverviewTab college={college} branchStats={branchStats} />}
      {tab === "branches" && <BranchesTab college={college} branchStats={branchStats} />}
      {tab === "cutoffs" && <CutoffsTab college={college} cutoffs={cutoffs} />}
      {tab === "fees" && <FeesTab college={college} />}
      {tab === "placements" && <PlacementsTab college={college} />}
      {tab === "faculty" && <FacultyTab college={college} />}
      {tab === "campus" && <CampusTab college={college} />}
      {tab === "labs" && <LabsTab college={college} />}
      {tab === "hostel" && <HostelTab college={college} />}
      {tab === "clubs" && <ClubsTab college={college} />}
      {tab === "events" && <EventsTab college={college} />}
      {tab === "hackathons" && <HackathonsTab college={college} />}
      {tab === "student-life" && <StudentLifeTab college={college} />}
      {tab === "history" && <HistoryTab college={college} />}
    </div>
  );
}
