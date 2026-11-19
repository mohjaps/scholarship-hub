import type { Opportunity, SourceRunResult } from "../types";
import { erasmusSource } from "./erasmus";
import { normalize } from "./normalize";
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
    categories: [6, 24, 1280, 1281, 1282, 10, 75], perPage: 60,
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

/** Run every source in parallel; one failing source never fails the run. */
export async function scrapeAll(sources: Source[] = SOURCES, now = new Date()): Promise<ScrapeOutcome> {
  const scrapedAt = now.toISOString();
  const byId = new Map<string, Opportunity>();
  const results = await Promise.all(
    sources.map(async (source): Promise<SourceRunResult> => {
      const t0 = Date.now();
      try {
        const raws = await source.fetch();
        let count = 0;
        for (const raw of raws) {
          const item = normalize(raw, source, scrapedAt);
          if (item && !byId.has(item.id)) {
            byId.set(item.id, item);
            count++;
          }
        }
        return { sourceId: source.id, ok: true, count, ms: Date.now() - t0 };
      } catch (e) {
        return { sourceId: source.id, ok: false, count: 0, error: String(e instanceof Error ? e.message : e), ms: Date.now() - t0 };
      }
    }),
  );
  return { items: [...byId.values()], results };
}
