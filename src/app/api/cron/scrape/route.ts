import { timingSafeEqual } from "node:crypto";
import { runScrape } from "@/lib/run";

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
  const run = await runScrape();
  return Response.json(run, { status: run.results.some((r) => r.ok) ? 200 : 502 });
}
