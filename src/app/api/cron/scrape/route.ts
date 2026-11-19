import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { runScrape } from "@/lib/run";
import { storeKind } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Called daily by Vercel Cron (see vercel.json). */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  if (storeKind() === "cache") {
    // No database: drop the cached scrape so the next visitor gets fresh data.
    revalidateTag("scrape", { expire: 0 });
    return Response.json({ storage: "cache", revalidated: true });
  }
  const run = await runScrape();
  return Response.json(run, { status: run.results.some((r) => r.ok) ? 200 : 502 });
}
