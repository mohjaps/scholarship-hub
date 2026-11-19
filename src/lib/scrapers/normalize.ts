import { createHash } from "node:crypto";
import {
  detectDeadline,
  detectFunding,
  detectKind,
  detectLang,
  detectLevels,
  detectPalestinian,
  isArticleNotOpportunity,
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
