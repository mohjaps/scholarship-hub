import { parseQuery } from "@/lib/params";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/opportunities?q=&level=bachelor|master|phd&kind=&palestinian=eligible|explicit&lang=ar|en|fr&source=&expired=1&page=
 */
export async function GET(request: Request) {
  const query = parseQuery(new URL(request.url).searchParams);
  const result = await getStore().query(query);
  return Response.json(result, {
    headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}
