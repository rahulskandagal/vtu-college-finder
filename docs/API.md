# REST API reference

All endpoints are under `/api`. Responses are JSON:

```json
{ "data": … }                                   // success
{ "error": { "message": "…", "details": … } }   // failure (details = zod issues when validation fails)
```

Status codes: `200` OK · `201` created · `400` validation · `401` not logged in · `403` not admin · `404` not found · `409` unique conflict · `413` payload too large · `429` rate-limited · `500` server error.

Authentication uses an httpOnly cookie (`vcf_session`) set by `/api/auth/login` or `/api/auth/register`. Browser requests send it automatically; for scripts, pass the cookie jar.

Slugs: every endpoint that takes `:slug` for a college also accepts the KEA college code (e.g. `E101`); branch parameters accept slug, KEA branch code (`CS`) or short name (`CSE`).

---

## Auth

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` | password ≥ 8 chars with a letter and a number; sets cookie; rate-limited 10/15 min |
| POST | `/api/auth/login` | `{ email, password }` | sets cookie; rate-limited 20/15 min |
| POST | `/api/auth/logout` | — | clears cookie |
| GET | `/api/auth/me` | — | `{ id, email, name, role }` or `null` |

## Colleges

| Method | Path | Query | Returns |
| --- | --- | --- | --- |
| GET | `/api/colleges` | `q, district, type, branch, fee (0-100000 / 100000-200000 / 200000-300000 / 300000-), hostel (yes/no), minPlacement, sort (name/cutoff/fee/placement/established), page, pageSize` | `{ items: CollegeCard[], total, page, pageSize }` |
| GET | `/api/colleges/:slug` | — | full profile with departments, branches, fees, faculty, facilities, labs, hostels, placements, recruiters, events, hackathons, clubs, achievements, milestones, images, source + `branchStats` (GM cutoff stats per branch) |
| GET | `/api/colleges/:slug/:resource` | `branch` (cutoffs only) | one sub-collection: `cutoffs, fees, faculty, placements, events, hackathons, clubs, labs, facilities, hostels, departments, recruiters, achievements, milestones, branches` |

`CollegeCard` = `{ id, slug, code, name, shortName, district, city, type, establishedYear, autonomous, accreditation[], hostelAvailable, imageUrl, isDemo, popularBranches[], bestGmCutoff, latestFee, latestPlacement }`.

## Branches

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/branches` | all branches with `_count.colleges` |
| GET | `/api/branches/:slug?category=GM` | branch + colleges offering it + `cutoffOverview` (per-college stats for the category) |

## Cutoffs

| Method | Path | Query |
| --- | --- | --- |
| GET | `/api/cutoffs` | `college, branch, year, round, category, gender, maxRank, minRank, page, pageSize (≤200)` → paginated rows with college, branch and source |

## Search & recommendation

| Method | Path | Body / query |
| --- | --- | --- |
| GET | `/api/search?q=jnnce&limit=12` | `{ colleges: CollegeCard[], branches[] }` — matches name, short name, code, city, district, branch |
| POST | `/api/recommend` | `{ rank, category="GM", gender="ALL", branches[] (slugs), districts[], collegeTypes[], maxFee?, hostelRequired=false, placementImportance=3, years[]? }` → `{ input, groups: [{ group, label, description, items[] }], totalConsidered, yearsConsidered, disclaimer }`; rate-limited 60/min |

Each recommendation item: `{ college, branch, group (LIKELY|POSSIBLE|COMPETITIVE|UNLIKELY|NO_DATA), reason, categoryUsed, usedFallbackCategory, stats { years[], latest, recentMin, recentMax, recentAverage, yoyChange, yoyChangePercent, trend, mostCompetitive, leastCompetitive }, latestFee, latestPlacement, sources[] }`.

## Student (login required)

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/student/profile` | — |
| POST / PUT | `/api/student/profile` | `{ kcetRank?, category?, gender?, preferredBranches[], preferredDistricts[], collegeTypePref?, budgetMax?, hostelRequired, placementImportance, campusPreference? }` (upsert) |
| GET | `/api/shortlist` | — |
| POST | `/api/shortlist` | `{ collegeId, branchId?, note? }` (upsert per college) |
| DELETE | `/api/shortlist/:id` | `id` = shortlist row id **or** college id |
| GET | `/api/comparisons` | — |
| POST | `/api/comparisons` | `{ name, collegeIds[2..4] }` |
| DELETE | `/api/comparisons/:id` | — |
| GET | `/api/reviews?collegeId=` | approved reviews |
| POST | `/api/reviews` | `{ collegeId, rating 1-5, text? }` (pending admin approval) |

## Admin (role = ADMIN)

Generic CRUD for every resource key:

`sources, colleges, branches, departments, college-branches, cutoffs, fees, faculty, facilities, laboratories, hostels, placements, recruiters, college-recruiters, events, hackathons, clubs, achievements, milestones, images`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/:resource?q=&collegeId=&page=&pageSize=` | paginated list with relations; `q` searches the resource's text fields |
| POST | `/api/admin/:resource` | create; body validated by the resource's zod schema (`src/lib/validation/admin.ts`); colleges derive `slug` from `name` if omitted |
| GET | `/api/admin/:resource/:id` | one record |
| PUT / PATCH | `/api/admin/:resource/:id` | partial update — merged with the existing row and re-validated |
| DELETE | `/api/admin/:resource/:id` | delete (cascades per schema) |
| GET | `/api/admin/stats` | counts + recent imports |
| POST | `/api/admin/cutoffs/import` | `multipart/form-data`: `file` (.csv/.xlsx/.xls, ≤10 MB, ≤100k rows), `mode` = `validate` (default) or `import`, `sourceId?`, `isDemo` (`true`/`false`), `overwrite` (`true` updates existing rows) |

Import response:

```json
{
  "mode": "validate",
  "total": 120, "valid": 117, "invalid": 3,
  "duplicatesInFile": 1, "duplicatesInDb": 40,
  "errors": [{ "rowNumber": 5, "field": "college_code", "message": "Unknown college code \"E999\"" }],
  "preview": [ …first 20 valid rows… ],
  "imported": 77, "updated": 0, "skipped": 40, "status": "PARTIAL"   // import mode only
}
```

CSV columns (header aliases like *College Code*, *Closing Rank*, *cutoff* are normalised):

```
college_code, college_name*, branch, year, round*, category, gender*, seat_type*, opening_rank*, closing_rank
```

## Example

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"rank":18542,"category":"GM","branches":["computer-science-engineering"],"districts":["Shivamogga"],"hostelRequired":true}'
```
