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
  /** Posts to read per run (newest first). Max 100. */
  perPage?: number;
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

export function wpPostsUrl(cfg: WordPressConfig): string {
  const params = new URLSearchParams({
    per_page: String(cfg.perPage ?? 40),
    orderby: "date",
    order: "desc",
  });
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
      const [posts, categories] = await Promise.all([
        fetchJson<WpPost[]>(wpPostsUrl(cfg), 45_000),
        fetchJson<WpCategory[]>(`${cfg.base}/wp-json/wp/v2/categories?per_page=100&_fields=id,name`).catch(
          () => [] as WpCategory[],
        ),
      ]);
      const names = new Map(categories.map((c) => [c.id, decodeEntities(c.name)]));
      return posts.map((p) => wpPostToRaw(p, names, cfg.base));
    },
  };
}
