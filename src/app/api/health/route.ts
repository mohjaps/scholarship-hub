import { databaseUrlVar, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Configuration and database status. Reports env var NAMES only, never values. */
export async function GET() {
  const dbVar = databaseUrlVar();
  const body: Record<string, unknown> = {
    databaseEnvVar: dbVar,
    databaseEnvVarsPresent: Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|PG(HOST|USER|DATABASE)|NEON/.test(k)).sort(),
    cronSecretSet: !!process.env.CRON_SECRET,
  };
  try {
    const store = getStore();
    const [result, lastRun] = await Promise.all([store.query({ pageSize: 1, includeExpired: true }), store.lastRun()]);
    body.database = "ok";
    body.opportunities = result.total;
    body.lastRun = lastRun && { finishedAt: lastRun.finishedAt, total: lastRun.total, failedSources: lastRun.results.filter((r) => !r.ok).map((r) => r.sourceId) };
  } catch (e) {
    body.database = "error";
    body.error = e instanceof Error ? e.message.slice(0, 300) : String(e);
  }
  return Response.json(body, { status: body.database === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
