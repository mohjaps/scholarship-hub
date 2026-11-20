import { createHash } from "node:crypto";
import {
  detectDeadline,
  detectFunding,
  detectKind,
  detectLang,
  detectLevels,
  detectPalestinian,
  isArticleNotOpportunity,
  isRestrictedToOthers,
  truncate,
} from "../classify";
import type { Kind, Level, Opportunity } from "../types";

/** What a scraper hands back before classification. */
export interface RawItem {
  url: string;
  title: string;
  /** Plain-text body (already stripped of HTML). */
  text: string;
  /** Plain-text short description; falls back to the start of `text`. */
  excerpt?: string;
  publishedAt?: string | null;
  /** Category / tag names from the source, used as classification hints. */
  hints?: string[];
  /** Overrides when the source knows better than the classifier. */
  kind?: Kind;
  levels?: Level[];
  funding?: Opportunity["funding"];
  palestinian?: Opportunity["palestinian"];
  deadline?: string | null;
  titleAr?: string | null;
  summaryAr?: string | null;
}

export function canonicalUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  for (const p of [...u.searchParams.keys()]) if (/^utm_|^fbclid$|^ref$/.test(p)) u.searchParams.delete(p);
  return u.toString().replace(/\/$/, "");
}

export function idFor(url: string): string {
  return createHash("sha1").update(canonicalUrl(url)).digest("hex").slice(0, 20);
}

/**
 * Turn a raw scraped item into an Opportunity, or null when it is not one
 * (a guide, a roundup, a job post, or nothing about study/travel).
 */
export function normalize(
  raw: RawItem,
  source: { id: string; name: string },
  scrapedAt: string,
): Opportunity | null {
  const title = raw.title.trim();
  if (!title || isArticleNotOpportunity(title)) return null;
  // The site is for Palestinian students: skip calls limited to other nationalities.
  if (isRestrictedToOthers(title)) return null;

  const hints = (raw.hints ?? []).join(" ");
  // The title is the best signal; category names only break ties.
  const kind = raw.kind ?? detectKind(title) ?? detectKind(hints);
  if (!kind) return null;

  const body = `${title}\n${raw.text}`;
  const levels = raw.levels ?? detectLevels(`${title} ${hints} ${raw.text.slice(0, 4000)}`);

  return {
    id: idFor(raw.url),
    sourceId: source.id,
    sourceName: source.name,
    url: canonicalUrl(raw.url),
    title,
    summary: truncate(raw.excerpt || raw.text, 320),
    titleAr: raw.titleAr ?? null,
    summaryAr: raw.summaryAr ?? null,
    lang: detectLang(`${title} ${raw.text.slice(0, 1500)}`),
    kind,
    levels,
    funding: raw.funding ?? detectFunding(body),
    palestinian: raw.palestinian ?? detectPalestinian(body),
    deadline: raw.deadline !== undefined ? raw.deadline : detectDeadline(body),
    publishedAt: raw.publishedAt ?? null,
    scrapedAt,
  };
}

const DEDUPE_STOP = new Set(
  (
    "fully funded funded scholarship scholarships program programme programs programmes in for the of and to at a an " +
    "with international students student apply now how full partially partial guide step by deadline deadlines open " +
    "application applications no ielts required without free study paid"
  ).split(" "),
);

/**
 * Key that is equal for the same opportunity posted by different aggregators:
 * the headline's significant words, ignoring years, order and SEO filler.
 * "CERN Summer Student Program 2027 in Switzerland (Fully Funded)" and
 * "CERN Summer Student Program 2027 in Switzerland | Paid" share a key.
 */
export function dedupeKey(title: string): string {
  const head = title.toLowerCase().split(/\s+[|–—]\s+/)[0];
  const words = (head.match(/[a-z0-9؀-ۿ]+/g) ?? []).filter((w) => !DEDUPE_STOP.has(w) && !/^20\d\d$/.test(w));
  return [...new Set(words)].sort().join(" ");
}

const P_RANK = { explicit: 0, open: 1, unknown: 2 } as const;

/** Merge copies of one opportunity: keep the most informative, combine signals. */
export function mergeDuplicates(items: Opportunity[]): Opportunity[] {
  const groups = new Map<string, Opportunity[]>();
  const out: Opportunity[] = [];
  for (const item of items) {
    // Curated annual entries stay separate so the annual tab keeps them.
    const key = item.sourceId === "official" ? "" : dedupeKey(item.title);
    if (!key || key.split(" ").length < 2) {
      out.push(item);
      continue;
    }
    const g = groups.get(key);
    if (g) g.push(item);
    else groups.set(key, [item]);
  }
  for (const group of groups.values()) {
    const best = [...group].sort(
      (a, b) =>
        Number(!!b.deadline) - Number(!!a.deadline) ||
        Number(b.lang === "ar") - Number(a.lang === "ar") ||
        b.summary.length - a.summary.length,
    )[0];
    const levels = [...new Set(group.flatMap((g) => g.levels))].sort(
      (a, b) => ["bachelor", "master", "phd"].indexOf(a) - ["bachelor", "master", "phd"].indexOf(b),
    );
    const palestinian = group.map((g) => g.palestinian).sort((a, b) => P_RANK[a] - P_RANK[b])[0];
    const funding = group.some((g) => g.funding === "full") ? "full" : group.some((g) => g.funding === "partial") ? "partial" : "unknown";
    out.push({ ...best, levels, palestinian, funding });
  }
  return out;
}
