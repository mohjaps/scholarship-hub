import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterForm } from "@/components/FilterForm";
import { OpportunityCard } from "@/components/OpportunityCard";
import { dictionaries, isLocale, type Locale } from "@/i18n/dictionaries";
import { parseQuery, toSearchParams } from "@/lib/params";
import { SOURCES } from "@/lib/scrapers";
import { getStore } from "@/lib/store";
import { todayIso } from "@/lib/store/filter";
import { KINDS, LEVELS, type OpportunityQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

function href(locale: Locale, q: OpportunityQuery) {
  const qs = toSearchParams(q).toString();
  return `/${locale}${qs ? `?${qs}` : ""}`;
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionaries[locale];
  const query = parseQuery(await searchParams);
  const store = getStore();
  const [result, lastRun] = await Promise.all([store.query(query), store.lastRun()]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const today = todayIso();
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";
  const hasFilters = !!(query.q || query.level || query.kind || query.palestinian || query.lang || query.source || query.includeExpired);

  return (
    <>
      <a href="#results" className="skip">
        {t.skipToResults}
      </a>
      <header className="hero">
        <div className="wrap">
          <div className="topbar">
            <Link href={`/${locale}`} className="brand">
              <span className="brand-mark" aria-hidden="true">
                ✦
              </span>
              {t.siteName}
            </Link>
            <Link href={href(otherLocale, query)} className="lang-switch" hrefLang={otherLocale} lang={otherLocale}>
              {t.switchLanguage}
            </Link>
          </div>
          <p className="tagline">{t.tagline}</p>

          <nav className="level-tabs" aria-label={t.allLevels}>
            <Link href={href(locale, { ...query, level: undefined, page: 1 })} aria-current={!query.level ? "page" : undefined}>
              {t.allLevels}
            </Link>
            {LEVELS.map((l) => (
              <Link key={l} href={href(locale, { ...query, level: l, page: 1 })} aria-current={query.level === l ? "page" : undefined}>
                {t.levels[l]}
              </Link>
            ))}
          </nav>

          <FilterForm action={`/${locale}`}>
            {query.level && <input type="hidden" name="level" value={query.level} />}
            <div className="search-row">
              <input
                type="search"
                name="q"
                defaultValue={query.q}
                placeholder={t.searchPlaceholder}
                aria-label={t.search}
                dir="auto"
              />
              <button type="submit">{t.search}</button>
            </div>
            <div className="filter-row">
              <label>
                <span className="sr-only">{t.allKinds}</span>
                <select name="kind" defaultValue={query.kind ?? ""}>
                  <option value="">{t.allKinds}</option>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t.kinds[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t.palestinianFilter}</span>
                <select name="palestinian" defaultValue={query.palestinian ?? ""}>
                  <option value="">
                    {t.palestinianFilter}: {t.palestinianAny}
                  </option>
                  <option value="eligible">{t.palestinianEligible}</option>
                  <option value="explicit">{t.palestinianExplicit}</option>
                </select>
              </label>
              <label>
                <span className="sr-only">{t.anyLanguage}</span>
                <select name="lang" defaultValue={query.lang ?? ""}>
                  <option value="">{t.anyLanguage}</option>
                  {(["ar", "en", "fr"] as const).map((l) => (
                    <option key={l} value={l}>
                      {t.languageName[l]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t.anySource}</span>
                <select name="source" defaultValue={query.source ?? ""}>
                  <option value="">{t.anySource}</option>
                  {SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input type="checkbox" name="expired" value="1" defaultChecked={query.includeExpired} />
                {t.includeExpired}
              </label>
              {hasFilters && (
                <Link href={`/${locale}`} className="reset">
                  {t.reset}
                </Link>
              )}
            </div>
          </FilterForm>
        </div>
      </header>

      <main id="results" className="wrap">
        <p className="count" role="status">
          {t.results(result.total)}
        </p>

        {result.items.length === 0 ? (
          <p className="empty">{lastRun ? t.empty : t.emptyNoData}</p>
        ) : (
          <div className="grid">
            {result.items.map((item) => (
              <OpportunityCard key={item.id} item={item} t={t} locale={locale} today={today} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label={t.page(result.page, pages)}>
            {result.page > 1 ? (
              <Link href={href(locale, { ...query, page: result.page - 1 })} rel="prev">
                {t.prev}
              </Link>
            ) : (
              <span />
            )}
            <span>{t.page(result.page, pages)}</span>
            {result.page < pages ? (
              <Link href={href(locale, { ...query, page: result.page + 1 })} rel="next">
                {t.next}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>

      <footer className="footer">
        <div className="wrap">
          <p className="disclaimer">{t.disclaimer}</p>
          {lastRun && (
            <p>
              {t.lastUpdated}:{" "}
              <time dateTime={lastRun.finishedAt}>
                {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                }).format(new Date(lastRun.finishedAt))}{" "}
                UTC
              </time>
            </p>
          )}
          <p>
            {t.sources}:{" "}
            {SOURCES.map((s, i) => (
              <span key={s.id}>
                {i > 0 && " · "}
                <a href={s.homepage} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
              </span>
            ))}
          </p>
        </div>
      </footer>
    </>
  );
}
