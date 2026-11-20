import { htmlToText, decodeEntities } from "../classify";
import { fetchJson } from "./http";
import type { RawItem } from "./normalize";
import type { Source } from "./source";

interface WpPost {
  id: number | string;
  link?: string;
  date_gmt?: string;
  date?: string;
  /** Standard WP: { rendered }. Some customised APIs return a plain string. */
  title: { rendered: string } | string;
  excerpt?: { rendered: string };
  content?: { rendered: string };
  categories?: number[];
  // Fields some customised APIs (e.g. youthop.com) add:
  category?: { name?: string };
  /** Unix seconds. */
  deadline?: number | string | null;
  region?: string;
}

const rendered = (v: { rendered: string } | string | undefined) => (typeof v === "string" ? v : (v?.rendered ?? ""));

interface WpCategory {
  id: number;
  name: string;
}

export interface WordPressConfig {
  id: string;
  name: string;
  homepage: string;
  region: Source["region"];
  /** Base URL of the WP site (no trailing slash). */
  base: string;
  /** Only posts in these categories. Omit to take every post. */
  categories?: number[];
  categoriesExclude?: number[];
  /** Posts per API page (max 100). */
  perPage?: number;
  /** Pages to read at most (newest first). Default 3. */
  maxPages?: number;
  /**
   * Fetch full post bodies (better deadline/eligibility detection). Turn off
   * for sites whose bodies are huge or slow; the excerpt is used instead.
   */
  withContent?: boolean;
  /** Don't send _fields (for customised APIs whose extra fields it would strip). */
  allFields?: boolean;
}

export function cleanExcerpt(html: string): string {
  return htmlToText(html)
    .replace(/The post .* appeared first on .*$/s, "")
    .replace(/\[(…|&hellip;|\.\.\.)\]|Read more.*$|Continue reading.*$|اقرأ المزيد.*$/gis, "")
    .trim();
}

/**
 * Scholarships are often posted months before their deadline, so read several
 * pages (300 newest posts), not just the latest page. Expired ones are hidden
 * by deadline later. (A date filter would drop sites that rarely post.)
 */
const DEFAULT_MAX_PAGES = 3;

export function wpPostsUrl(cfg: WordPressConfig, page = 1): string {
  const params = new URLSearchParams({
    per_page: String(cfg.perPage ?? 100),
    orderby: "date",
    order: "desc",
  });
  if (page > 1) params.set("page", String(page));
  if (!cfg.allFields) {
    params.set("_fields", `id,link,date,date_gmt,title,excerpt,categories${cfg.withContent === false ? "" : ",content"}`);
  }
  if (cfg.categories?.length) params.set("categories", cfg.categories.join(","));
  if (cfg.categoriesExclude?.length) params.set("categories_exclude", cfg.categoriesExclude.join(","));
  return `${cfg.base}/wp-json/wp/v2/posts?${params}`;
}

export function wpPostToRaw(post: WpPost, categoryNames: Map<number, string>, base = ""): RawItem {
  const text = htmlToText(post.content?.rendered ?? post.excerpt?.rendered ?? "");
  const date = post.date_gmt ? `${post.date_gmt}Z` : post.date;
  const deadlineSec = Number(post.deadline);
  const hints = (post.categories ?? []).map((c) => categoryNames.get(c)).filter((n): n is string => !!n);
  if (post.category?.name) hints.push(post.category.name);
  const raw: RawItem = {
    // Without a link, /?p=<id> redirects to the post on any WordPress site.
    url: post.link || `${base}/?p=${post.id}`,
    title: decodeEntities(rendered(post.title)).replace(/<[^>]+>/g, "").trim(),
    text: [text, post.region && `Region: ${post.region}`].filter(Boolean).join("\n"),
    excerpt: cleanExcerpt(post.excerpt?.rendered ?? ""),
    publishedAt: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null,
    hints,
  };
  if (Number.isFinite(deadlineSec) && deadlineSec > 1e9) {
    raw.deadline = new Date(deadlineSec * 1000).toISOString().slice(0, 10);
  }
  return raw;
}

export function wordpressSource(cfg: WordPressConfig): Source {
  return {
    id: cfg.id,
    name: cfg.name,
    homepage: cfg.homepage,
    region: cfg.region,
    async fetch() {
      const perPage = cfg.perPage ?? 100;
      // Page 1 must succeed; later pages are best-effort (WP answers 400 past the last page).
      const [first, categories] = await Promise.all([
        fetchJson<WpPost[]>(wpPostsUrl(cfg, 1), 45_000),
        fetchJson<WpCategory[]>(`${cfg.base}/wp-json/wp/v2/categories?per_page=100&_fields=id,name`).catch(
          () => [] as WpCategory[],
        ),
      ]);
      const more =
        first.length < perPage
          ? []
          : await Promise.all(
              Array.from({ length: (cfg.maxPages ?? DEFAULT_MAX_PAGES) - 1 }, (_, i) =>
                fetchJson<WpPost[]>(wpPostsUrl(cfg, i + 2), 45_000).catch(() => [] as WpPost[]),
              ),
            );
      const seen = new Set<string>();
      const posts = [first, ...more].flat().filter((p) => !seen.has(String(p.id)) && !!seen.add(String(p.id)));
      const names = new Map(categories.map((c) => [c.id, decodeEntities(c.name)]));
      return posts.map((p) => wpPostToRaw(p, names, cfg.base));
    },
  };
}
