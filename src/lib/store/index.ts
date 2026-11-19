import { FileStore } from "./file";
import { PostgresStore } from "./postgres";
import type { Store } from "./types";

export type { Store, ScrapeRun } from "./types";

let store: Store | null = null;

/** Postgres when DATABASE_URL (or Vercel's POSTGRES_URL) is set, else a local JSON file. */
export function getStore(): Store {
  if (store) return store;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) return (store = new PostgresStore(url));
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Add a Neon Postgres database to the Vercel project.");
  }
  return (store = new FileStore());
}
