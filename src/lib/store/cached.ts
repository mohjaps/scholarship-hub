import { unstable_cache } from "next/cache";
import { scrapeAll } from "../scrapers";
import type { OpportunityQuery } from "../types";
import { applyQuery } from "./filter";
import type { ScrapeRun, Store } from "./types";

/** How long a scrape is reused before the next visitor triggers a fresh one. */
const REVALIDATE_SECONDS = 12 * 60 * 60;

const cachedScrapeInner = unstable_cache(
  async () => {
    const startedAt = new Date();
    const { items, results } = await scrapeAll(undefined, startedAt);
    const run: ScrapeRun = {
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      total: items.length,
      results,
    };
    return { items, run };
  },
  // Vercel's data cache outlives deployments: key it on the commit so a new
  // deploy (new sources or classifier rules) never serves an older scrape.
  ["scrape-all", process.env.VERCEL_GIT_COMMIT_SHA ?? "local"],
  { revalidate: REVALIDATE_SECONDS, tags: ["scrape"] },
);

// Share one in-flight scrape between concurrent requests on the same instance.
let inflight: ReturnType<typeof cachedScrapeInner> | null = null;
function cachedScrape() {
  inflight ??= cachedScrapeInner().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Zero-setup store for deployments without a database: scrapes on demand and
 * keeps the result in Next's data cache (shared across serverless instances
 * on Vercel). Only the latest scrape is kept, so there is no history.
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
