import { scrapeAll } from "./scrapers";
import { getStore, type ScrapeRun } from "./store";

/** Scrape every source and save the results. Used by the cron route and the CLI. */
export async function runScrape(): Promise<ScrapeRun> {
  const startedAt = new Date();
  const { items, results } = await scrapeAll(undefined, startedAt);
  const store = getStore();
  await store.upsert(items);
  const run: ScrapeRun = {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    total: items.length,
    results,
  };
  await store.recordRun(run);
  return run;
}
