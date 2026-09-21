/**
 * One-command local run: starts the bundled PostgreSQL, applies migrations,
 * seeds on first run, then starts the Next.js app.
 *
 *   npm run start:local            # dev server  (http://localhost:3000)
 *   npm run start:local -- --prod  # production build + server (faster pages)
 *
 * Ctrl+C stops both. Data persists in ./.pgdata between runs.
 */
import EmbeddedPostgres from "embedded-postgres";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, ".pgdata");
const PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);
const APP_PORT = process.env.PORT ?? "3000";
const DB = "vtu_college_finder";
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/${DB}`;
const prod = process.argv.includes("--prod");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function ensureEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(
      envPath,
      [
        `DATABASE_URL="${DATABASE_URL}"`,
        `AUTH_SECRET="local-dev-secret-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}"`,
        `NEXT_PUBLIC_APP_URL="http://localhost:${APP_PORT}"`,
        `ADMIN_EMAIL="admin@vtucollegefinder.local"`,
        `ADMIN_PASSWORD="Admin@12345"`,
        "",
      ].join("\n"),
    );
    console.log("Created .env with local defaults");
  }
}

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(true));
    s.once("listening", () => s.close(() => resolve(false)));
    s.listen(port, "127.0.0.1");
  });
}

function run(args, extraEnv = {}) {
  const r = spawnSync(npmCmd, args, { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, DATABASE_URL, ...extraEnv } });
  if (r.status !== 0) {
    console.error(`\n"npm ${args.join(" ")}" failed (exit ${r.status}).`);
    process.exit(r.status ?? 1);
  }
}

async function main() {
  ensureEnvFile();

  const pg = new EmbeddedPostgres({ databaseDir, user: "postgres", password: "postgres", port: PORT, persistent: true, onLog: () => {}, onError: () => {} });
  let startedHere = false;
  if (await portInUse(PORT)) {
    console.log(`PostgreSQL already listening on ${PORT} — reusing it.`);
  } else {
    const fresh = !fs.existsSync(path.join(databaseDir, "PG_VERSION"));
    if (fresh) {
      console.log("First run: initialising local PostgreSQL cluster (one-time)…");
      await pg.initialise();
    }
    // stale postmaster.pid from a crash would block startup
    const pid = path.join(databaseDir, "postmaster.pid");
    if (fs.existsSync(pid)) fs.rmSync(pid, { force: true });
    await pg.start();
    if (fresh) await pg.createDatabase(DB);
    startedHere = true;
    console.log(`PostgreSQL running on port ${PORT}`);
  }

  console.log("Applying database migrations…");
  run(["run", "db:deploy"]);

  // Seed once (real KEA data) if there are no colleges yet.
  const check = spawnSync(process.execPath, ["-e", `const {Client}=require('pg');(async()=>{const c=new Client('${DATABASE_URL}');await c.connect();const r=await c.query('select count(*) from "College"');console.log(r.rows[0].count);await c.end();})().catch(()=>console.log('0'))`], { cwd: root, encoding: "utf8" });
  if ((check.stdout ?? "0").trim() === "0") {
    console.log("Database is empty — importing KEA cut-off data (takes ~1–2 minutes)…");
    run(["run", "db:seed"]);
  }

  let app;
  if (prod) {
    if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
      console.log("Building production bundle…");
      run(["run", "build"]);
    }
    console.log(`Starting production server on http://localhost:${APP_PORT}`);
    app = spawn(npmCmd, ["run", "start", "--", "--port", APP_PORT], { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, DATABASE_URL, PORT: APP_PORT } });
  } else {
    console.log(`Starting dev server on http://localhost:${APP_PORT}`);
    app = spawn(npmCmd, ["run", "dev", "--", "--port", APP_PORT], { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, DATABASE_URL } });
  }

  const shutdown = async () => {
    console.log("\nStopping…");
    try { app.kill(); } catch {}
    if (startedHere) await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  app.on("exit", (code) => { if (startedHere) pg.stop().catch(() => {}).finally(() => process.exit(code ?? 0)); else process.exit(code ?? 0); });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
