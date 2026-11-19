import { htmlToText, decodeEntities } from "../classify";
import { fetchJson } from "./http";
import type { RawItem } from "./normalize";
import type { Source } from "./source";

interface WpPost {
  id: number;
  link: string;
  date_gmt?: string;
  date?: string;
  title: { rendered: string };
  excerpt?: { rendered: string };
  content?: { rendered: string };
  categories?: number[];
}

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
    _fields: `id,link,date,date_gmt,title,excerpt,categories${cfg.withContent === false ? "" : ",content"}`,
  });
  if (cfg.categories?.length) params.set("categories", cfg.categories.join(","));
  if (cfg.categoriesExclude?.length) params.set("categories_exclude", cfg.categoriesExclude.join(","));
  return `${cfg.base}/wp-json/wp/v2/posts?${params}`;
}

export function wpPostToRaw(post: WpPost, categoryNames: Map<number, string>): RawItem {
  const text = htmlToText(post.content?.rendered ?? post.excerpt?.rendered ?? "");
  const date = post.date_gmt ? `${post.date_gmt}Z` : post.date;
  return {
    url: post.link,
    title: decodeEntities(post.title.rendered).replace(/<[^>]+>/g, "").trim(),
    text,
    excerpt: cleanExcerpt(post.excerpt?.rendered ?? ""),
    publishedAt: date ? new Date(date).toISOString() : null,
    hints: (post.categories ?? []).map((c) => categoryNames.get(c)).filter((n): n is string => !!n),
  };
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
      return posts.map((p) => wpPostToRaw(p, names));
    },
  };
}
