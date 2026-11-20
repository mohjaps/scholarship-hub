import { unstable_cache } from "next/cache";
import { combine, scrapeSource, SOURCES } from "../scrapers";
import type { Opportunity, OpportunityQuery, SourceRunResult } from "../types";
import { applyQuery, todayIso } from "./filter";
import type { ScrapeRun, Store } from "./types";

/** How long a scrape is reused before the next visitor triggers a fresh one. */
const REVALIDATE_SECONDS = 12 * 60 * 60;
// Vercel's data cache outlives deployments: key it on the commit so a new
// deploy (new sources or classifier rules) never serves an older scrape.
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

/**
 * One cache entry per source: Vercel's data cache rejects entries over 2 MB,
 * and all sources together exceed that. Expired items are dropped before
 * caching (this mode keeps no history anyway).
 */
const cachedSource = unstable_cache(
  async (sourceId: string) => {
    const source = SOURCES.find((s) => s.id === sourceId)!;
    const { items, result } = await scrapeSource(source);
    const today = todayIso();
    return {
      items: items.filter((o) => !o.deadline || o.deadline >= today),
      result,
      finishedAt: new Date().toISOString(),
    };
  },
  ["scrape-source", VERSION],
  { revalidate: REVALIDATE_SECONDS, tags: ["scrape"] },
);

async function scrapeEverything(): Promise<{ items: Opportunity[]; run: ScrapeRun }> {
  const startedAt = new Date().toISOString();
  const parts = await Promise.all(SOURCES.map((s) => cachedSource(s.id)));
  const items = combine(parts);
  const results: SourceRunResult[] = parts.map((p) => p.result);
  const finishedAt = parts.map((p) => p.finishedAt).sort().at(-1) ?? startedAt;
  return { items, run: { startedAt, finishedAt, total: items.length, results } };
}

// Share one in-flight combination between concurrent requests on the same instance.
let inflight: ReturnType<typeof scrapeEverything> | null = null;
function cachedScrape() {
  inflight ??= scrapeEverything().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Zero-setup store for deployments without a database: scrapes on demand and
 * keeps each source's result in Next's data cache (shared across serverless
 * instances on Vercel). Only the latest scrape is kept, so there is no history.
 */
export class CachedScrapeStore implements Store {
  async upsert() {}
  async recordRun() {}

  async query(query: OpportunityQuery) {
    const { items } = await cachedScrape();
    return applyQuery(items, query);
  }

  async get(id: string) {
    const { items } = await cachedScrape();
    return items.find((i) => i.id === id) ?? null;
  }

  async lastRun() {
    return (await cachedScrape()).run;
  }
}
