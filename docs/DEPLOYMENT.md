# Deployment

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (`postgresql://user:pass@host:5432/db?sslmode=require` for managed providers) |
| `AUTH_SECRET` | yes | ≥ 32 random characters; signs session JWTs (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin, used for canonical URLs, Open Graph and the sitemap |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed only | Credentials for the first admin created by `npm run db:seed` |
| `RUN_MIGRATIONS` | Docker only | `true` (default) runs `prisma migrate deploy` on container start |

Never commit `.env`. Rotate `AUTH_SECRET` to invalidate all sessions.

## 1. Docker (any VPS / Railway / Render / Fly.io)

```bash
docker compose up -d --build        # Postgres + app on http://localhost:3000
# optional demo data — run from your machine against the container's DB:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtu_college_finder npm run db:seed
```

The image is a multi-stage build using Next.js `output: "standalone"`; the entrypoint applies migrations before starting `node server.js`. Point `DATABASE_URL` at a managed Postgres in production and drop the `db` service.

**Railway / Render / Fly:** create a PostgreSQL add-on, set the three required variables, deploy from the Dockerfile. Health-check path: `/api/branches`.

## 2. Vercel + managed Postgres (Neon / Supabase / Railway)

1. Create the database and copy the pooled connection string into `DATABASE_URL`.
2. `vercel env add AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.
3. Build command: `npm run build` (the `postinstall` step runs `prisma generate`).
4. Run migrations from CI or locally against the production DB: `DATABASE_URL=… npm run db:deploy`.
5. Seed only if you want the **demo** dataset: `DATABASE_URL=… npm run db:seed` (all rows are flagged demo).

Because pages are rendered on demand (`force-dynamic`), no ISR configuration is required; add caching (e.g. `unstable_cache`/`"use cache"`) on `listColleges` and college profiles when traffic grows.

## 3. Bare Node.js

```bash
npm ci
npm run build
npm run db:deploy
npm start          # or: node .next/standalone/server.js
```

Put it behind nginx/Caddy for TLS and set `NEXT_PUBLIC_APP_URL` to the public https origin so cookies are marked `secure`.

## Post-deploy checklist

- [ ] Create the admin account (`npm run db:seed` with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, or register a user and set `role = ADMIN` in the database).
- [ ] Add real `Source` records and import verified KEA cutoffs (`/admin/import`).
- [ ] Remove demo data (rows linked to the "Demo seed data" source) before going public.
- [ ] Set up daily database backups.
- [ ] Replace the in-memory rate limiter with Redis if running more than one instance.
- [ ] Submit `/sitemap.xml` to Google Search Console.
