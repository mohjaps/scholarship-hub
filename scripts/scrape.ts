/**
 * Run the scraper once from the command line:
 *   npm run scrape
 * Saves to Postgres when DATABASE_URL is set, otherwise to .data/opportunities.json.
 */
import { runScrape } from "../src/lib/run";

async function main() {
  const run = await runScrape();
  console.table(run.results.map(({ sourceId, ok, count, ms, error }) => ({ sourceId, ok, count, ms, error: error?.slice(0, 80) ?? "" })));
  console.log(`Saved ${run.total} opportunities.`);
  if (run.results.every((r) => !r.ok)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
