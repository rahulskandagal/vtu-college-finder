# VTU College Finder

**Engineering college discovery, KCET cutoff history & career information platform for Karnataka students.**

A student enters their KCET rank, category and preferences and gets colleges/branches grouped by how their rank compares with historical cutoffs — then researches each college in depth: 10 years of round-wise & category-wise cutoffs, fees by quota, placements, faculty, labs, campus, hostel, clubs, events, hackathons and history. Colleges and branches can be compared side by side, shortlisted, and saved to a student dashboard. An admin dashboard manages every entity and imports cutoffs in bulk from CSV/Excel with validation.

> **Disclaimer.** KCET cutoff information shown on this platform is based on historical and publicly available data. Cutoffs can change from year to year depending on category, seat availability, demand, counselling rounds and other factors. This platform does not guarantee admission.

> **Demo data.** The seed dataset (`prisma/seed.ts`) contains **illustrative sample numbers only** (cutoffs, fees, placements, faculty placeholders, events, clubs). Every seeded record is flagged `isDemo = true` and linked to a "Demo seed data" source, and the UI shows a *Demo data* badge/banner wherever it appears. Replace it with verified KEA / college data before any public use.

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

### Option A — no Postgres installed? Use Prisma's local Postgres (dev only)

```bash
npm run db:local       # starts a local PostgreSQL (WASM) server and prints its URL
```

Put the printed URL in `.env` as `DATABASE_URL` (change the database name from `template1` to `vtu_college_finder` — it is created automatically by `prisma migrate dev`), e.g.
`postgres://postgres:postgres@localhost:51214/vtu_college_finder?sslmode=disable`.
Later use `npx prisma dev ls`, `npx prisma dev stop vtu`, `npx prisma dev start vtu`.

### Option B — Docker Postgres

```bash
docker compose up -d db    # PostgreSQL 16 on localhost:5432 (see docker-compose.yml)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtu_college_finder
```

### Migrate, seed, run

```bash
npm run db:migrate     # applies prisma/migrations (creates the DB if needed)
npm run db:seed        # loads the DEMO dataset + admin/student accounts
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
| `npm run db:local` | Start Prisma local Postgres (dev only) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Project structure

```
prisma/
  schema.prisma          # 25 models — see docs/DATABASE.md
  migrations/            # SQL migrations
  seed.ts                # demo dataset (flagged isDemo)
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

## Loading real data

1. Add a **Source** (`/admin/sources`) for the KEA document / college page, with URL, year and verification date.
2. Import cutoffs from CSV/Excel at `/admin/import` (validate → import), attaching the source and leaving *demo* unchecked. Columns: `college_code, college_name*, branch, year, round*, category, gender*, seat_type*, opening_rank*, closing_rank`.
3. Add/edit every other entity from the admin dashboard; each record has `sourceId`, `isDemo` and timestamps.
4. Delete the demo rows (filter by the "Demo seed data" source) once real data is in place.

Never fabricate values: leave fields empty and the UI will show *Information not available*.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Docker image, docker-compose, Railway/Render/Fly, Vercel + managed Postgres).

## Documentation

- [docs/API.md](docs/API.md) — REST API reference
- [docs/DATABASE.md](docs/DATABASE.md) — schema & relationships
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production setup

## Roadmap / AI-ready architecture

The data layer (`src/lib/data/*`) exposes typed, source-annotated queries that a future AI assistant can call as tools (e.g. "rank 18000, CSE near Shivamogga" → `recommendColleges`; "why did the cutoff change?" → `computeStats`). Answers can then cite `Source` rows instead of inventing information.
