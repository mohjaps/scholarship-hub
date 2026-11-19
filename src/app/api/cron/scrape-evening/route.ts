// Second daily run, 12 hours after /api/cron/scrape. Vercel's Hobby plan allows
// each cron job to run at most once a day, so "every 12 hours" is two jobs.
export { GET } from "../scrape/route";

// Segment config must be declared literally in each route file.
export const dynamic = "force-dynamic";
export const maxDuration = 300;
