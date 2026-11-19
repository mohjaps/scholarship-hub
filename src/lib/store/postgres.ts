import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Opportunity, OpportunityQuery } from "../types";
import { DEFAULT_PAGE_SIZE, STALE_DAYS, todayIso } from "./filter";
import type { ScrapeRun, Store } from "./types";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS opportunities (
    id            text PRIMARY KEY,
    source_id     text NOT NULL,
    source_name   text NOT NULL,
    url           text NOT NULL,
    title         text NOT NULL,
    summary       text NOT NULL,
    title_ar      text,
    summary_ar    text,
    lang          text NOT NULL,
    kind          text NOT NULL,
    levels        text[] NOT NULL DEFAULT '{}',
    funding       text NOT NULL,
    palestinian   text NOT NULL,
    deadline      date,
    published_at  timestamptz,
    scraped_at    timestamptz NOT NULL,
    first_seen_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS opportunities_deadline_idx ON opportunities (deadline)`,
  `CREATE INDEX IF NOT EXISTS opportunities_scraped_idx ON opportunities (scraped_at)`,
  `CREATE TABLE IF NOT EXISTS scrape_runs (
    id          bigserial PRIMARY KEY,
    started_at  timestamptz NOT NULL,
    finished_at timestamptz NOT NULL,
    total       integer NOT NULL,
    results     jsonb NOT NULL
  )`,
];

const COLUMNS = `id, source_id, source_name, url, title, summary, title_ar, summary_ar, lang, kind, levels,
  funding, palestinian, deadline::text AS deadline, published_at, scraped_at`;

type Row = Record<string, unknown>;

const toIso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());

function rowToOpportunity(r: Row): Opportunity {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    sourceName: r.source_name as string,
    url: r.url as string,
    title: r.title as string,
    summary: r.summary as string,
    titleAr: (r.title_ar as string | null) ?? null,
    summaryAr: (r.summary_ar as string | null) ?? null,
    lang: r.lang as Opportunity["lang"],
    kind: r.kind as Opportunity["kind"],
    levels: (r.levels as Opportunity["levels"]) ?? [],
    funding: r.funding as Opportunity["funding"],
    palestinian: r.palestinian as Opportunity["palestinian"],
    deadline: (r.deadline as string | null) ?? null,
    publishedAt: toIso(r.published_at),
    scrapedAt: toIso(r.scraped_at)!,
  };
}

/** Builds the WHERE clause; must match applyQuery() in filter.ts. */
export function buildWhere(query: OpportunityQuery, now = new Date()) {
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;
  const where = [`scraped_at >= ${p(new Date(now.getTime() - STALE_DAYS * 86_400_000).toISOString())}`];
  const today = p(todayIso(now));
  if (!query.includeExpired) where.push(`(deadline IS NULL OR deadline >= ${today}::date)`);
  if (query.level) where.push(`${p(query.level)} = ANY(levels)`);
  if (query.kind) where.push(`kind = ${p(query.kind)}`);
  if (query.lang) where.push(`lang = ${p(query.lang)}`);
  if (query.source) where.push(`source_id = ${p(query.source)}`);
  if (query.palestinian === "explicit") where.push(`palestinian = 'explicit'`);
  if (query.palestinian === "eligible") where.push(`palestinian <> 'unknown'`);
  if (query.q?.trim()) {
    const like = p(`%${query.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    where.push(
      `(title ILIKE ${like} OR summary ILIKE ${like} OR coalesce(title_ar,'') ILIKE ${like} OR coalesce(summary_ar,'') ILIKE ${like} OR source_name ILIKE ${like})`,
    );
  }
  const orderBy = `CASE WHEN deadline IS NULL THEN 1 WHEN deadline >= ${today}::date THEN 0 ELSE 2 END,
    CASE WHEN deadline >= ${today}::date THEN deadline END ASC,
    CASE WHEN deadline < ${today}::date THEN deadline END DESC,
    published_at DESC NULLS LAST, id`;
  return { where: where.join(" AND "), orderBy, params };
}

export class PostgresStore implements Store {
  private sql: NeonQueryFunction<false, false>;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    this.sql = neon(url);
  }

  private ensureSchema() {
    this.ready ??= (async () => {
      for (const stmt of SCHEMA) await this.sql.query(stmt);
    })().catch((e) => {
      this.ready = null;
      throw e;
    });
    return this.ready;
  }

  async upsert(items: Opportunity[]) {
    if (!items.length) return;
    await this.ensureSchema();
    // One round trip: send the batch as JSON and expand it server-side.
    for (let i = 0; i < items.length; i += 500) {
      const batch = items.slice(i, i + 500);
      await this.sql.query(
        `INSERT INTO opportunities (id, source_id, source_name, url, title, summary, title_ar, summary_ar, lang, kind,
           levels, funding, palestinian, deadline, published_at, scraped_at)
         SELECT x.id, x."sourceId", x."sourceName", x.url, x.title, x.summary, x."titleAr", x."summaryAr", x.lang, x.kind,
           ARRAY(SELECT jsonb_array_elements_text(x.levels)), x.funding, x.palestinian, x.deadline::date,
           x."publishedAt"::timestamptz, x."scrapedAt"::timestamptz
         FROM jsonb_to_recordset($1::jsonb) AS x(
           id text, "sourceId" text, "sourceName" text, url text, title text, summary text, "titleAr" text,
           "summaryAr" text, lang text, kind text, levels jsonb, funding text, palestinian text, deadline text,
           "publishedAt" text, "scrapedAt" text)
         ON CONFLICT (id) DO UPDATE SET
           source_id = EXCLUDED.source_id, source_name = EXCLUDED.source_name, url = EXCLUDED.url,
           title = EXCLUDED.title, summary = EXCLUDED.summary, title_ar = EXCLUDED.title_ar,
           summary_ar = EXCLUDED.summary_ar, lang = EXCLUDED.lang, kind = EXCLUDED.kind, levels = EXCLUDED.levels,
           funding = EXCLUDED.funding, palestinian = EXCLUDED.palestinian, deadline = EXCLUDED.deadline,
           published_at = EXCLUDED.published_at, scraped_at = EXCLUDED.scraped_at`,
        [JSON.stringify(batch)],
      );
    }
  }

  async query(query: OpportunityQuery) {
    await this.ensureSchema();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const { where, orderBy, params } = buildWhere(query);
    const [rows, count] = await Promise.all([
      this.sql.query(
        `SELECT ${COLUMNS} FROM opportunities WHERE ${where} ORDER BY ${orderBy} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        params,
      ),
      this.sql.query(`SELECT count(*)::int AS n FROM opportunities WHERE ${where}`, params),
    ]);
    return {
      items: (rows as Row[]).map(rowToOpportunity),
      total: ((count as Row[])[0]?.n as number) ?? 0,
      page,
      pageSize,
    };
  }

  async get(id: string) {
    await this.ensureSchema();
    const rows = (await this.sql.query(`SELECT ${COLUMNS} FROM opportunities WHERE id = $1`, [id])) as Row[];
    return rows[0] ? rowToOpportunity(rows[0]) : null;
  }

  async recordRun(run: ScrapeRun) {
    await this.ensureSchema();
    await this.sql.query(
      `INSERT INTO scrape_runs (started_at, finished_at, total, results) VALUES ($1, $2, $3, $4::jsonb)`,
      [run.startedAt, run.finishedAt, run.total, JSON.stringify(run.results)],
    );
    await this.sql.query(`DELETE FROM scrape_runs WHERE id NOT IN (SELECT id FROM scrape_runs ORDER BY id DESC LIMIT 200)`);
  }

  async lastRun() {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      `SELECT started_at, finished_at, total, results FROM scrape_runs ORDER BY id DESC LIMIT 1`,
    )) as Row[];
    const r = rows[0];
    if (!r) return null;
    return {
      startedAt: toIso(r.started_at)!,
      finishedAt: toIso(r.finished_at)!,
      total: r.total as number,
      results: r.results as ScrapeRun["results"],
    };
  }
}
