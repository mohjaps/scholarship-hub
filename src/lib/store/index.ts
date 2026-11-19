import { FileStore } from "./file";
import { PostgresStore } from "./postgres";
import type { Store } from "./types";

export type { Store, ScrapeRun } from "./types";

/**
 * Env vars that may hold the Postgres URL. The Vercel Neon integration sets
 * DATABASE_URL / POSTGRES_URL, or <PREFIX>_DATABASE_URL / <PREFIX>_POSTGRES_URL
 * when a custom prefix was chosen while connecting the database.
 */
export function databaseUrlVar(): string | null {
  const preferred = ["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"];
  for (const name of preferred) if (process.env[name]) return name;
  const prefixed = Object.keys(process.env)
    .filter((k) => /_(DATABASE_URL|POSTGRES_URL)$/.test(k) && process.env[k])
    .sort();
  return prefixed[0] ?? null;
}

export class MissingDatabaseError extends Error {
  constructor() {
    super("No Postgres connection string found (DATABASE_URL / POSTGRES_URL). Connect a Neon database to the Vercel project and redeploy.");
  }
}

let store: Store | null = null;

/** Postgres when a connection string is set, else a local JSON file (dev only). */
export function getStore(): Store {
  if (store) return store;
  const name = databaseUrlVar();
  if (name) return (store = new PostgresStore(process.env[name]!));
  if (process.env.VERCEL) throw new MissingDatabaseError();
  return (store = new FileStore());
}
