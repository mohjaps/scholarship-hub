export const LEVELS = ["bachelor", "master", "phd"] as const;
export type Level = (typeof LEVELS)[number];

export const KINDS = [
  "scholarship",
  "fellowship",
  "exchange",
  "conference",
  "training",
  "internship",
] as const;
export type Kind = (typeof KINDS)[number];

/**
 * explicit: the text names Palestine/Palestinians/Gaza/West Bank as eligible.
 * open:     open to all nationalities / any country (Palestinians can apply).
 * unknown:  nationality rules not stated in what we scraped.
 */
export const PALESTINIAN = ["explicit", "open", "unknown"] as const;
export type PalestinianEligibility = (typeof PALESTINIAN)[number];

export const FUNDING = ["full", "partial", "unknown"] as const;
export type Funding = (typeof FUNDING)[number];

export type ContentLang = "ar" | "en" | "fr";

export interface Opportunity {
  /** Stable id: sha1 of the canonical URL. */
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  summary: string;
  /** Arabic title/summary when the source (or the curated list) provides one. */
  titleAr?: string | null;
  summaryAr?: string | null;
  lang: ContentLang;
  kind: Kind;
  levels: Level[];
  funding: Funding;
  palestinian: PalestinianEligibility;
  /** ISO date (YYYY-MM-DD) or null when no deadline could be read. */
  deadline: string | null;
  /** ISO datetime when the source published it. */
  publishedAt: string | null;
  /** ISO datetime of the scrape that last saw it. */
  scrapedAt: string;
}

export interface OpportunityQuery {
  q?: string;
  level?: Level;
  kind?: Kind;
  palestinian?: "explicit" | "eligible";
  lang?: ContentLang;
  source?: string;
  /** Only the curated annual programmes. */
  annual?: boolean;
  includeExpired?: boolean;
  page?: number;
  pageSize?: number;
}

export interface QueryResult {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SourceRunResult {
  sourceId: string;
  ok: boolean;
  count: number;
  error?: string;
  ms: number;
}
