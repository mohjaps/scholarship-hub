import { KINDS, LEVELS, type ContentLang, type OpportunityQuery } from "./types";

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function read(params: Params, key: string): string | undefined {
  const v = params instanceof URLSearchParams ? params.get(key) : params[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

const oneOf = <T extends string>(v: string | undefined, allowed: readonly T[]) =>
  v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

/** Parse and validate filters from a URL (page searchParams or API query). */
export function parseQuery(params: Params): OpportunityQuery {
  const page = Number(read(params, "page"));
  return {
    q: read(params, "q")?.slice(0, 100),
    level: oneOf(read(params, "level"), LEVELS),
    kind: oneOf(read(params, "kind"), KINDS),
    palestinian: oneOf(read(params, "palestinian"), ["explicit", "eligible"] as const),
    lang: oneOf<ContentLang>(read(params, "lang"), ["ar", "en", "fr"]),
    source: read(params, "source")?.slice(0, 50),
    annual: read(params, "annual") === "1",
    includeExpired: read(params, "expired") === "1",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

/** Inverse of parseQuery, for building links. */
export function toSearchParams(q: OpportunityQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.level) sp.set("level", q.level);
  if (q.kind) sp.set("kind", q.kind);
  if (q.palestinian) sp.set("palestinian", q.palestinian);
  if (q.lang) sp.set("lang", q.lang);
  if (q.source) sp.set("source", q.source);
  if (q.annual) sp.set("annual", "1");
  if (q.includeExpired) sp.set("expired", "1");
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  return sp;
}
