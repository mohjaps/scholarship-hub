import { parseQuery } from "@/lib/params";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
// The first request on a deployment without a database runs the scraper.
export const maxDuration = 300;

/**
 * GET /api/opportunities?q=&level=bachelor|master|phd&kind=&palestinian=eligible|explicit&lang=ar|en|fr&source=&expired=1&page=
 */
export async function GET(request: Request) {
  const query = parseQuery(new URL(request.url).searchParams);
  let result;
  try {
    result = await getStore().query(query);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Database unavailable. See /api/health." }, { status: 503 });
  }
  return Response.json(result, {
    headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}
