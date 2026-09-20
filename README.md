# VTU College Finder

**Engineering college discovery, KCET cutoff history & career information platform for Karnataka students.**

A student enters their KCET rank, category and preferences and gets colleges/branches grouped by how their rank compares with historical cutoffs — then researches each college in depth: 10 years of round-wise & category-wise cutoffs, fees by quota, placements, faculty, labs, campus, hostel, clubs, events, hackathons and history. Colleges and branches can be compared side by side, shortlisted, and saved to a student dashboard. An admin dashboard manages every entity and imports cutoffs in bulk from CSV/Excel with validation.

> **Disclaimer.** KCET cutoff information shown on this platform is based on historical and publicly available data. Cutoffs can change from year to year depending on category, seat availability, demand, counselling rounds and other factors. This platform does not guarantee admission.

> **Real data.** The default seed loads **official KEA UGCET cut-off documents** for every participating engineering college in Karnataka: 283 colleges (KEA codes E001–E511), ~90 branches and **2,84,073 closing-rank records** covering 2019–2025, all rounds (1 / 2 / 3-extended), all 28 KEA categories and both seat pools (General and Hyderabad-Karnataka 371-J). Every row is linked to a `Source` naming the KEA PDF it was parsed from. Fees, placements, faculty, campus and student-life data are **not** loaded yet and show as *Information not available* until entered through the admin dashboard with a source. An optional illustrative dataset (`prisma/seed-demo.ts`, all rows flagged `isDemo`) exists for empty development databases only.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 14+ |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JWT (HS256, `jose`) in an httpOnly cookie; bcrypt password hashing |
| Validation | zod (API bodies, query strings, CSV rows) |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Tests | Vitest |
| Import | papaparse (CSV) + SheetJS (Excel) |

## Features

- **Rank finder** (`/find`) — rank + category + gender + branches + districts + college type + fee cap + hostel + placement importance → *Likely / Possible / Competitive / Historically unlikely* groups with the reasoning, 3-year closing-rank window, YoY change, trend, fee, placement and sources for each college/branch.
- **Cutoff explorer** (`/cutoffs`, and per college/branch) — 10 years of opening & closing ranks by round, category, gender and seat type; line charts (compare rounds or compare categories); most/least competitive year; year-on-year change.
- **College directory** (`/colleges`) — search by name / KEA code / city / district; filters for district, branch, type, fee band, hostel, placement %; sort by cutoff, fee, placement, established year.
- **College profile** (`/college/[slug]`) — tabs: Overview, Branches, Cutoffs, Fees (per quota and year), Placements (history chart, department-wise, recruiter filter by sector), Faculty, Campus, Labs, Hostel, Clubs, Events, Hackathons, Student Life, History (timeline + year-by-year snapshot). Every record shows its source and a demo badge where applicable; missing data is shown as "Information not available".
- **Branch pages** (`/branches`, `/branches/[slug]`, `/college/[slug]/[branch]`) — subjects, careers, higher studies, skills, colleges offering it, cross-college cutoff trend.
- **Compare** — up to 4 colleges (`/compare`) or 4 branches (`/compare/branches`); no single "best" score, just the data.
- **Aggregated views** — `/placements`, `/events`, `/hackathons`, `/clubs`, `/campus-life`, `/kcet-guide` (counselling steps + official links).
- **Student dashboard** (`/dashboard`) — saved rank/category/preferences, shortlist with notes, saved comparisons.
- **Admin dashboard** (`/admin`) — CRUD for colleges, departments, branches, college↔branch, cutoffs, fees, placements, recruiters, faculty, facilities, labs, hostels, images, events, hackathons, clubs, achievements, milestones and sources; CSV/Excel cutoff import with dry-run validation (missing fields, invalid ranks/years, unknown college codes/branches, in-file and in-database duplicates), import logs.
- **SEO** — unique URLs per college and branch, metadata + Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`.
- **Security** — bcrypt (12 rounds), HS256 JWT sessions, role-based authorization (`STUDENT` / `ADMIN`) enforced in route handlers and pages, zod validation on all inputs, in-memory rate limiting on auth/recommend, ORM-only data access, security headers via `proxy.ts`, no secrets in client code.

## Quick start (local development)

Requirements: **Node.js ≥ 20.9** (tested on 24), npm, and a PostgreSQL database.

```bash
git clone <this repo> vtu-college-finder
cd vtu-college-finder
npm install            # also runs `prisma generate`
cp .env.example .env   # then edit DATABASE_URL / AUTH_SECRET / ADMIN_*
```

### Option A — no Postgres installed? Use the bundled local PostgreSQL (dev only)

```bash
npm run db:local       # real PostgreSQL 18 binaries (embedded-postgres), data in ./.pgdata, port 5433
```

Keep that terminal open (Ctrl+C stops it, or `npm run db:local:stop`). Use
`DATABASE_URL="postgresql://postgres:postgres@localhost:5433/vtu_college_finder"` in `.env`.

### Option B — Docker Postgres

```bash
docker compose up -d db    # PostgreSQL 16 on localhost:5432 (see docker-compose.yml)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtu_college_finder
```

### Migrate, seed, run

```bash
npm run db:migrate     # applies prisma/migrations (creates the DB if needed)
npm run db:seed        # admin/student accounts + imports all KEA cut-off documents (~1–2 min)
npm run dev            # http://localhost:3000
```

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | value of `ADMIN_EMAIL` in `.env` | value of `ADMIN_PASSWORD` |
| Student | `student@example.com` | `Student@123` |

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (cutoff engine, CSV validation) |
| `npm run db:local` / `db:local:stop` | Start / stop the bundled local PostgreSQL (dev only) |
| `npm run db:import:kea` | (Re-)import `data/kea/*.json` into the database (`-- --wipe` to start clean) |
| `npm run kea:parse` | Re-parse every KEA PDF in `data/raw/` to `data/kea/*.json` (needs Python + `pdfplumber`) |
| `npm run db:seed:demo` | Illustrative demo records — refuses to run if real colleges exist |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Users + real KEA import |
| `npm run db:studio` | Prisma Studio |

## Project structure

```
prisma/
  schema.prisma          # 25 models — see docs/DATABASE.md
  migrations/            # SQL migrations
  seed.ts                # users + KEA import (real data)
  import-kea.ts          # loads data/kea/*.json (colleges, branches, cutoffs, sources)
  kea/branches.ts        # canonical branch registry (KEA course codes / names → branch)
  kea/geo.ts             # Karnataka place → district lookup
  seed-demo.ts           # optional illustrative data (isDemo) for empty dev DBs
data/
  raw/                   # official KEA cut-off PDFs (2019–2025)
  kea/                   # parsed JSON per document
scripts/
  parse_kea_cutoff_pdf.py, parse_all_kea.sh, local-postgres.mjs
src/
  app/                   # Next.js App Router pages + route handlers
    api/                 # REST API — see docs/API.md
    admin/               # admin dashboard (layout-guarded)
    college/[slug]/      # college profile + /[branch] pages
    ...
  components/
    ui/                  # buttons, cards, badges, forms, source notes, disclaimers
    college/             # cards, rank form, results, compare tray, profile tabs
    charts/              # Recharts wrappers + interactive cutoff explorer
    admin/               # generic resource manager, import form
    dashboard/           # profile form, shortlist & comparison lists
  lib/
    prisma.ts            # Prisma client (pg adapter)
    cutoff-engine.ts     # pure eligibility grouping / trend statistics
    data/                # server-only data access (colleges, cutoffs, recommend, branches, search)
    validation/          # zod schemas (auth, student, admin, common)
    import/cutoffs.ts    # CSV/Excel parsing + validation
    admin/               # resource registry (server) + field definitions (client)
    auth/                # password hashing, JWT session helpers
    api.ts               # response helpers, error handling, auth guards
    rate-limit.ts
  proxy.ts               # route protection + security headers
tests/                   # vitest
docs/                    # API, database, deployment docs
```

## How the eligibility grouping works

For each (college, branch) with cutoffs for the student's category (falling back to GM if none), the engine takes the **final-round closing rank** for each of the last three years and computes `recentMin`/`recentMax`:

| Group | Rule |
| --- | --- |
| Likely available | rank ≤ 0.85 × recentMin |
| Possible | rank ≤ recentMax |
| Competitive | rank ≤ 1.35 × recentMax |
| Historically unlikely | otherwise |

Thresholds live in `src/lib/cutoff-engine.ts` (`THRESHOLDS`) and are covered by unit tests. Results are always shown with the disclaimer and the underlying numbers.

## KEA data pipeline

```
KEA PDF (cetonline.karnataka.gov.in) ──► scripts/parse_kea_cutoff_pdf.py ──► data/kea/kea-<year>-r<round>-<gen|hk>.json
                                                                                   │
                                            prisma/import-kea.ts  ◄────────────────┘
                                            (canonical branches: prisma/kea/branches.ts · geography: prisma/kea/geo.ts)
```

- `data/raw/` holds the 37 official PDFs (2019 R2–R3, 2020–2025 R1–R3, General + HK). `scripts/parse_all_kea.sh` lists their source URLs on the KEA server.
- The parser understands both KEA layouts (2019–2024 "CS Computers 1234 …" and 2025 "Course Name …" tables), assigns numbers to category columns by x-position (the PDF text layer glues adjacent 6-digit ranks together), joins wrapped course names and rounds tie ranks (x.5).
- KEA's ~160 course labels are mapped to canonical branches in `prisma/kea/branches.ts` (e.g. `CS` / `BW` / `B TECH IN COMPUTER SCIENCE AND ENGINEERING` → *Computer Science and Engineering*); unmapped labels are imported verbatim so nothing is lost.
- College name, city and district are derived from KEA's text (`prisma/kea/geo.ts`); type/autonomy come from KEA's own annotations (`Govt.`, `(AUTONOMOUS)`, `University`). Established year, website, accreditation etc. are left empty — add them via the admin dashboard with a source.
- New year? Drop the PDF into `data/raw/`, add a line to `scripts/parse_all_kea.sh`, run `npm run kea:parse && npm run db:import:kea`.

For any other data (fees, placements, faculty, facilities…): add a **Source** in `/admin/sources`, then enter records via the admin dashboard or CSV import (`/admin/import` for cutoffs). Never fabricate values — leave fields empty and the UI shows *Information not available*.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Docker image, docker-compose, Railway/Render/Fly, Vercel + managed Postgres).

## Documentation

- [docs/API.md](docs/API.md) — REST API reference
- [docs/DATABASE.md](docs/DATABASE.md) — schema & relationships
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production setup

## Roadmap / AI-ready architecture

The data layer (`src/lib/data/*`) exposes typed, source-annotated queries that a future AI assistant can call as tools (e.g. "rank 18000, CSE near Shivamogga" → `recommendColleges`; "why did the cutoff change?" → `computeStats`). Answers can then cite `Source` rows instead of inventing information.
