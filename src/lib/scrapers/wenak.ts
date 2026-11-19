import * as cheerio from "cheerio";
import { detectPalestinian } from "../classify";
import { fetchText } from "./http";
import type { RawItem } from "./normalize";
import type { Source } from "./source";

/**
 * wenak.ps: a Palestinian classifieds site whose scholarship section lists
 * scholarships aimed at Palestinian students (external and in Palestine).
 * Listing pages carry title + host countries; detail pages carry the
 * expiry date and description.
 */
const BASE = "https://www.wenak.ps";
const LIST_PAGES = 3; // 20 cards per page, newest first
const DETAIL_CONCURRENCY = 6;

export interface WenakCard {
  url: string;
  title: string;
  countries: string;
  scope: string; // خارجي (abroad) | داخلي (in Palestine)
}

export function parseWenakList(html: string): WenakCard[] {
  const $ = cheerio.load(html);
  const cards: WenakCard[] = [];
  $(".scholarship-card").each((_, el) => {
    const onclick = $(el).find(".scholarship-card__inner").attr("onclick") ?? "";
    const url = onclick.match(/href='([^']+)'/)?.[1];
    const title = $(el).find(".scholarship-card__image img").attr("alt")?.trim();
    if (!url || !title) return;
    cards.push({
      url: new URL(url, BASE).toString(),
      title,
      countries: $(el).find(".scholarship-card__location").text().replace(/\s+/g, " ").trim(),
      scope: $(el).find(".scholarship-card__tag").first().text().trim(),
    });
  });
  return cards;
}

export function parseWenakDetail(html: string): { deadline: string | null; text: string } {
  const $ = cheerio.load(html);
  const dateText = $(".deadline-badge .date-text").text();
  const deadline = dateText.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const text = $(".scholarship-content")
    .first()
    .find("p, li")
    .map((_, p) => $(p).text().trim())
    .get()
    .filter(Boolean)
    .join("\n");
  return { deadline, text: text || $(".scholarship-content").first().text().replace(/\s+/g, " ").trim() };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export const wenakSource: Source = {
  id: "wenak",
  name: "Wenak (وين مكان) — منح للفلسطينيين",
  homepage: `${BASE}/scholarships`,
  region: "arab",
  async fetch() {
    const pages = await Promise.all(
      Array.from({ length: LIST_PAGES }, (_, i) =>
        fetchText(i === 0 ? `${BASE}/scholarships` : `${BASE}/scholarships?page=${i + 1}`, 30_000)
          .then(parseWenakList)
          .catch(() => [] as WenakCard[]),
      ),
    );
    const seen = new Set<string>();
    const cards = pages.flat().filter((c) => !seen.has(c.url) && !!seen.add(c.url));
    if (!cards.length) throw new Error("no scholarship cards found (layout changed?)");

    return mapLimit(cards, DETAIL_CONCURRENCY, async (card): Promise<RawItem> => {
      const detail = await fetchText(card.url, 25_000)
        .then(parseWenakDetail)
        .catch(() => ({ deadline: null, text: "" }));
      const where = card.scope === "داخلي" ? "داخل فلسطين" : card.countries;
      const text = [where && `الدولة: ${where}`, detail.text].filter(Boolean).join("\n");
      const detected = detectPalestinian(`${card.title}\n${text}`);
      return {
        url: card.url,
        title: card.title,
        text,
        excerpt: detail.text || (where ? `الدولة: ${where}` : ""),
        // Listed by a Palestinian site for Palestinian students.
        kind: "scholarship",
        palestinian: detected === "unknown" ? "open" : detected,
        deadline: detail.deadline,
      };
    });
  },
};
