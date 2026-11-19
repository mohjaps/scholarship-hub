import * as cheerio from "cheerio";
import { fetchText } from "./http";
import type { RawItem } from "./normalize";
import type { Source } from "./source";

const CATALOGUE = "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en";
const MAX_PAGES = 15;

export function parseCataloguePage(html: string): { items: RawItem[]; lastPage: number } {
  const $ = cheerio.load(html);
  const items: RawItem[] = [];
  $("article.ecl-card").each((_, el) => {
    const link = $(el).find(".ecl-content-block__title a").first();
    const href = link.attr("href");
    const title = link.find(".ecl-link__label").text().trim() || link.text().trim();
    if (!href || !title) return;
    const description = $(el).find(".ecl-content-block__description").text().replace(/\s+/g, " ").trim();
    const acronym = description.replace(/\s*-\s*Project overview.*$/i, "").trim();
    items.push({
      url: href,
      title,
      text: description,
      excerpt: `Erasmus Mundus Joint Master${acronym && acronym !== title ? ` (${acronym})` : ""}: a joint master's degree taught at universities in several European countries. Scholarships cover tuition, travel and a monthly allowance, and students of every nationality can apply.`,
      summaryAr:
        "ماجستير مشترك ضمن برنامج إيراسموس موندوس يُدرَّس في جامعات بعدة دول أوروبية. تغطي المنحة الرسوم والسفر وراتبًا شهريًا، والتقديم مفتوح لجميع الجنسيات.",
      kind: "scholarship",
      levels: ["master"],
      funding: "full",
      palestinian: "open",
      deadline: null,
    });
  });
  let lastPage = 0;
  $('a[href*="page="]').each((_, a) => {
    const m = $(a).attr("href")?.match(/[?&]page=(\d+)/);
    if (m) lastPage = Math.max(lastPage, +m[1]);
  });
  return { items, lastPage };
}

export const erasmusSource: Source = {
  id: "erasmus-mundus",
  name: "Erasmus Mundus Catalogue (EACEA)",
  homepage: CATALOGUE,
  region: "official",
  async fetch() {
    const first = parseCataloguePage(await fetchText(CATALOGUE, 30_000));
    const pages = Math.min(first.lastPage, MAX_PAGES);
    const rest = await Promise.all(
      Array.from({ length: pages }, (_, i) =>
        fetchText(`${CATALOGUE}?page=${i + 1}`, 30_000)
          .then((h) => parseCataloguePage(h).items)
          .catch(() => [] as RawItem[]),
      ),
    );
    const seen = new Set<string>();
    return [first.items, ...rest].flat().filter((it) => !seen.has(it.url) && !!seen.add(it.url));
  },
};
