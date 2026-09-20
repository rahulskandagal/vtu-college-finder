import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardBody, CardHeader, Container, Disclaimer, PageHeader } from "@/components/ui";
import { KCET_CATEGORIES, OFFICIAL_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "KCET counselling guide",
  description: "How KCET (UGCET) counselling works — document verification, option entry, mock allotment, rounds, fee payment and college reporting — with links to official KEA sources.",
};

const STEPS: { title: string; body: string }[] = [
  {
    title: "1. Result & rank",
    body: "KEA publishes the KCET (UGCET) result with a separate rank for each stream (Engineering, Agriculture, Pharmacy, etc.). The engineering rank considers KCET Physics, Chemistry and Mathematics scores together with the 2nd PUC / 12th board marks in those subjects, as per the weightage notified by KEA for that year.",
  },
  {
    title: "2. Document verification",
    body: "Candidates upload or present documents (marks cards, study/domicile certificates, caste/income certificates for reservation, special-category certificates) as per the KEA schedule. A verification slip records the categories you are eligible for. Cutoffs on this platform use the same category codes.",
  },
  {
    title: "3. Option entry",
    body: "After verification, you log in to the KEA portal and enter your preferences (college + course combinations) in priority order. You can enter as many options as you like; allotment considers them strictly in the order you set. Use this platform's Find Colleges and Compare tools to draft your list first.",
  },
  {
    title: "4. Mock allotment",
    body: "KEA usually runs a mock allotment based on the options entered so far. It shows what you would get with the current options and lets you re-order before the real round. The mock result is not an admission.",
  },
  {
    title: "5. Round 1 allotment",
    body: "The first real allotment is published. For each seat you can typically choose: accept and report to the college, accept but wait for a better seat in the next round, or reject and participate again. Read the choice definitions carefully in that year's KEA notification — they change.",
  },
  {
    title: "6. Round 2 and further rounds",
    body: "Unfilled and surrendered seats are re-allotted in Round 2. KEA may run an extended / additional round or a casual vacancy round depending on the year. Closing ranks in later rounds are usually higher (less competitive) than in Round 1, which is why this platform shows cutoffs round-wise.",
  },
  {
    title: "7. Fee payment",
    body: "Fees for government-quota seats are paid to KEA (online) within the deadline. The amount depends on college type (government / aided / private) and the fee-regulation order for that year. Management or COMEDK quota seats have separate fee structures — never mix them.",
  },
  {
    title: "8. College reporting",
    body: "Download the allotment order and report to the college with original documents before the last date. Missing the reporting date can forfeit the seat. Check hostel admission and transport formalities with the college at the same time.",
  },
];

export default function KcetGuidePage() {
  return (
    <Container className="py-8">
      <PageHeader title="KCET counselling guide" description="A plain-language overview of the UGCET (KCET) engineering counselling process. The official KEA notification for the current year is always the authority — this page summarises it and links to the sources." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {STEPS.map((s) => (
            <Card key={s.title}>
              <CardHeader title={s.title} />
              <CardBody className="text-sm text-slate-700">{s.body}</CardBody>
            </Card>
          ))}
          <Card>
            <CardHeader title="Category codes used in cutoff data" />
            <CardBody>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {KCET_CATEGORIES.map((c) => (
                  <li key={c.code}>
                    <span className="font-mono font-medium">{c.code}</span> — {c.label.split("— ")[1]}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">KEA also publishes cutoffs for Hyderabad-Karnataka (371J), rural and Kannada-medium sub-quotas; those appear under “seat type” in the cutoff explorer where data is loaded.</p>
            </CardBody>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Official sources" />
            <CardBody>
              <ul className="space-y-2 text-sm">
                {OFFICIAL_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {l.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Use this platform for counselling prep" />
            <CardBody className="space-y-2 text-sm">
              <p><Link href="/find" className="text-primary hover:underline">Find colleges for your rank</Link> — grouped by historical cutoffs.</p>
              <p><Link href="/cutoffs" className="text-primary hover:underline">Cutoff explorer</Link> — round-wise and category-wise history.</p>
              <p><Link href="/compare" className="text-primary hover:underline">Compare colleges</Link> — fees, placements, hostels, labs.</p>
              <p><Link href="/dashboard" className="text-primary hover:underline">Your dashboard</Link> — save rank, shortlist and comparisons to build your option list.</p>
            </CardBody>
          </Card>
          <Disclaimer />
        </div>
      </div>
    </Container>
  );
}
