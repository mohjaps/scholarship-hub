import type { Opportunity, OpportunityQuery, QueryResult } from "../types";

/** sourceId of the curated annual programmes (see scrapers/official.ts). */
export const ANNUAL_SOURCE_ID = "official";

export const DEFAULT_PAGE_SIZE = 24;
const PALESTINIAN_RANK = { explicit: 0, open: 1, unknown: 2 } as const;
/** Items not seen by a scrape for this long are hidden (the source removed them). */
export const STALE_DAYS = 120;

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** In-memory implementation of the query semantics; mirrors the SQL in postgres.ts. */
export function applyQuery(all: Opportunity[], query: OpportunityQuery, now = new Date()): QueryResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const today = todayIso(now);
  const staleBefore = new Date(now.getTime() - STALE_DAYS * 86_400_000).toISOString();
  const q = query.q?.trim().toLowerCase();

  const filtered = all.filter((o) => {
    if (o.scrapedAt < staleBefore) return false;
    if (!query.includeExpired && o.deadline && o.deadline < today) return false;
    if (query.level && !o.levels.includes(query.level)) return false;
    if (query.kind && o.kind !== query.kind) return false;
    if (query.lang && o.lang !== query.lang) return false;
    if (query.source && o.sourceId !== query.source) return false;
    if (query.annual && o.sourceId !== ANNUAL_SOURCE_ID) return false;
    if (query.palestinian === "explicit" && o.palestinian !== "explicit") return false;
    if (query.palestinian === "eligible" && o.palestinian === "unknown") return false;
    if (q) {
      const hay = `${o.title} ${o.summary} ${o.titleAr ?? ""} ${o.summaryAr ?? ""} ${o.sourceName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort(compareOpportunities(today));
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

/**
 * Upcoming deadlines first (soonest first), then items without a deadline
 * (newest first), then expired ones (only shown when asked for).
 */
export function compareOpportunities(today: string) {
  const bucket = (o: Opportunity) => (o.deadline ? (o.deadline >= today ? 0 : 2) : 1);
  return (a: Opportunity, b: Opportunity) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    if (ba === 0) return a.deadline!.localeCompare(b.deadline!);
    if (ba === 2) return b.deadline!.localeCompare(a.deadline!);
    // No deadline: Palestine-specific first, then open to all, then newest.
    const pr = PALESTINIAN_RANK[a.palestinian] - PALESTINIAN_RANK[b.palestinian];
    if (pr !== 0) return pr;
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  };
}
