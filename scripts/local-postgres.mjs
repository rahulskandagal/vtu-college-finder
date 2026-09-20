/**
 * Zero-install local PostgreSQL for development (real PostgreSQL binaries via
 * the `embedded-postgres` package — no Docker, no system install).
 *
 *   node scripts/local-postgres.mjs start     # initialise (first run) and start on port 5433
 *   node scripts/local-postgres.mjs stop
 *   node scripts/local-postgres.mjs status
 *
 * Data lives in ./.pgdata (git-ignored). Connection string:
 *   postgresql://postgres:postgres@localhost:5433/vtu_college_finder
 */
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, ".pgdata");
const PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);
const DB = "vtu_college_finder";

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  onLog: () => {},
  onError: (e) => console.error(String(e).trim()),
});

const cmd = process.argv[2] ?? "start";

async function main() {
  if (cmd === "start") {
    const fresh = !fs.existsSync(path.join(databaseDir, "PG_VERSION"));
    if (fresh) {
      console.log(`Initialising PostgreSQL cluster in ${databaseDir} …`);
      await pg.initialise();
    }
    await pg.start();
    if (fresh) await pg.createDatabase(DB);
    console.log(`PostgreSQL running on port ${PORT}`);
    console.log(`DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/${DB}"`);
    console.log("Press Ctrl+C to stop (or run: node scripts/local-postgres.mjs stop)");
    // keep the process alive; pg_ctl runs postgres detached
    process.stdin.resume();
    const shutdown = async () => {
      await pg.stop().catch(() => {});
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else if (cmd === "stop") {
    await pg.stop();
    console.log("PostgreSQL stopped");
  } else if (cmd === "status") {
    const pidFile = path.join(databaseDir, "postmaster.pid");
    console.log(fs.existsSync(pidFile) ? `running (pid ${fs.readFileSync(pidFile, "utf8").split("\n")[0]})` : "stopped");
  } else {
    console.error("usage: local-postgres.mjs start|stop|status");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
