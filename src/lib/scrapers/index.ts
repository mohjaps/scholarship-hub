import type { Opportunity, SourceRunResult } from "../types";
import { erasmusSource } from "./erasmus";
import { mergeDuplicates, normalize } from "./normalize";
import { officialSource } from "./official";
import type { Source } from "./source";
import { wenakSource } from "./wenak";
import { wordpressSource } from "./wordpress";

/**
 * Every source the scraper reads. Category ids come from each site's
 * /wp-json/wp/v2/categories; if a site renames them, update the ids here.
 */
export const SOURCES: Source[] = [
  // ---- Palestinian / Arabic
  wenakSource,
  wordpressSource({
    id: "persmind", name: "Persmind (برسمايند)", region: "arab",
    homepage: "https://persmind.com/", base: "https://persmind.com",
    // المنح, Scholarships, Bourses, مؤتمرات, Conferences, تدريبات
    categories: [51, 2548, 10248, 87, 2550, 81], perPage: 30,
    withContent: false, // bodies are ~40 KB each and the API is slow
  }),
  wordpressSource({
    id: "studyshoot", name: "StudyShoot (ستادي شوت)", region: "arab",
    homepage: "https://studyshoot.com/", base: "https://studyshoot.com",
    categories: [6248], // المنح والقبول الجامعي
  }),
  wordpressSource({
    id: "dirasaabroad", name: "Dirasa Abroad (دراسة بالخارج)", region: "arab",
    homepage: "https://scholarship.dirasaabroad.com/", base: "https://scholarship.dirasaabroad.com",
  }),
  // ---- Global aggregators
  wordpressSource({
    id: "scholars4dev", name: "Scholars4Dev", region: "global",
    homepage: "https://www.scholars4dev.com/", base: "https://www.scholars4dev.com",
    categoriesExclude: [3, 20, 34, 75], // Closed, List of, Tips, How-to
  }),
  wordpressSource({
    id: "opportunitydesk", name: "Opportunity Desk", region: "global",
    homepage: "https://opportunitydesk.org/", base: "https://opportunitydesk.org",
    // Scholarships, Fellowships, Undergraduate, Masters, PhD, Conferences, Training
    categories: [6, 24, 1280, 1281, 1282, 10, 75],
  }),
  wordpressSource({
    id: "opportunitiescorners", name: "Opportunities Corners", region: "global",
    homepage: "https://opportunitiescorners.com/", base: "https://opportunitiescorners.com",
    // Bachelor/Master/PhD, Fellowships, Middle East, Conferences, Exchange & Summer schools, Trainings
    categories: [64, 905, 942, 66, 61, 1058],
  }),
  wordpressSource({
    id: "greatyop", name: "Greatyop", region: "global",
    homepage: "https://greatyop.com/", base: "https://greatyop.com",
    // English categories only (every post is duplicated in French):
    // Scholarships, Undergraduate, Masters, PhD, Conferences, Trainings
    categories: [104, 108, 112, 116, 350, 156],
  }),
  wordpressSource({
    id: "scholarshipscorner", name: "Scholarships Corner", region: "global",
    homepage: "https://scholarshipscorner.website/", base: "https://www.scholarshipscorner.website",
  }),
  wordpressSource({
    id: "scholarshipregion", name: "Scholarship Region", region: "global",
    homepage: "https://www.scholarshipregion.com/", base: "https://www.scholarshipregion.com",
  }),
  wordpressSource({
    id: "fullyscholarships", name: "Fully Scholarships", region: "global",
    homepage: "https://fullyscholarships.com/", base: "https://fullyscholarships.com",
  }),
  wordpressSource({
    id: "montessoriline", name: "Montessori Line", region: "global",
    homepage: "https://montessoriline.com/", base: "https://montessoriline.com",
    // Fully funded scholarships, Currently open, Fellowships, Scholarship news & alerts
    categories: [48, 73, 60, 71, 70], perPage: 100,
  }),
  wordpressSource({
    id: "opportunitiescircle", name: "Opportunities Circle", region: "global",
    homepage: "https://opportunitiescircle.com/", base: "https://opportunitiescircle.com",
    withContent: false, // slow API; excerpts are enough
  }),
  wordpressSource({
    id: "scholarshipsfuture", name: "Scholarships Future", region: "global",
    homepage: "https://scholarshipsfuture.com/", base: "https://scholarshipsfuture.com",
  }),
  wordpressSource({
    id: "scholarshipinfocenter", name: "Scholarship Info Center", region: "global",
    homepage: "https://scholarshipinfocenter.com/", base: "https://scholarshipinfocenter.com",
  }),
  wordpressSource({
    id: "scholarglow", name: "ScholarGlow", region: "global",
    homepage: "https://scholarglow.com/", base: "https://scholarglow.com",
  }),
  wordpressSource({
    id: "scholarshiproar", name: "Scholarship Roar", region: "global",
    homepage: "https://scholarshiproar.com/", base: "https://scholarshiproar.com",
  }),
  wordpressSource({
    id: "mladiinfo", name: "Mladiinfo", region: "global",
    homepage: "https://www.mladiinfo.eu/", base: "https://www.mladiinfo.eu",
  }),
  wordpressSource({
    id: "youthop", name: "Youth Opportunities", region: "global",
    homepage: "https://www.youthop.com/", base: "https://www.youthop.com",
    allFields: true, // custom API: keeps its deadline/category/region fields
  }),
  // ---- Official

  erasmusSource,
  officialSource,
];

export interface ScrapeOutcome {
  items: Opportunity[];
  results: SourceRunResult[];
}

/** Scrape one source; never throws (a failure is reported in the result). */
export async function scrapeSource(
  source: Source,
  now = new Date(),
): Promise<{ items: Opportunity[]; result: SourceRunResult }> {
  const t0 = Date.now();
  const scrapedAt = now.toISOString();
  try {
    const raws = await source.fetch();
    const byId = new Map<string, Opportunity>();
    for (const raw of raws) {
      const item = normalize(raw, source, scrapedAt);
      if (item && !byId.has(item.id)) byId.set(item.id, item);
    }
    const items = [...byId.values()];
    return { items, result: { sourceId: source.id, ok: true, count: items.length, ms: Date.now() - t0 } };
  } catch (e) {
    const error = String(e instanceof Error ? e.message : e);
    return { items: [], result: { sourceId: source.id, ok: false, count: 0, error, ms: Date.now() - t0 } };
  }
}

/** Combine per-source results: drop cross-source id clashes, merge duplicates. */
export function combine(parts: { items: Opportunity[] }[]): Opportunity[] {
  const byId = new Map<string, Opportunity>();
  for (const part of parts) for (const item of part.items) if (!byId.has(item.id)) byId.set(item.id, item);
  return mergeDuplicates([...byId.values()]);
}

/** Run every source in parallel; one failing source never fails the run. */
export async function scrapeAll(sources: Source[] = SOURCES, now = new Date()): Promise<ScrapeOutcome> {
  const parts = await Promise.all(sources.map((s) => scrapeSource(s, now)));
  return { items: combine(parts), results: parts.map((p) => p.result) };
}
