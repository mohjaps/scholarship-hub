import type { Dictionary, Locale } from "@/i18n/dictionaries";
import type { Opportunity } from "@/lib/types";

function daysUntil(deadline: string, today: string): number {
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86_400_000);
}

function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function OpportunityCard({
  item,
  t,
  locale,
  today,
}: {
  item: Opportunity;
  t: Dictionary;
  locale: Locale;
  today: string;
}) {
  const title = (locale === "ar" && item.titleAr) || item.title;
  const summary = (locale === "ar" && item.summaryAr) || item.summary;
  const contentLang = locale === "ar" && item.titleAr ? "ar" : item.lang;
  const days = item.deadline ? daysUntil(item.deadline, today) : null;
  const urgency = days === null ? "none" : days < 0 ? "closed" : days <= 14 ? "soon" : "open";

  return (
    <article className="card">
      <div className="card-top">
        <span className={`kind kind-${item.kind}`}>{t.kinds[item.kind]}</span>
        {item.palestinian !== "unknown" && (
          <span className={`badge pal-${item.palestinian}`}>{t.palestinianBadge[item.palestinian]}</span>
        )}
      </div>

      <h2 className="card-title" lang={contentLang} dir="auto">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h2>

      {summary && (
        <p className="card-summary" lang={contentLang} dir="auto">
          {summary}
        </p>
      )}

      <ul className="tags" aria-label={t.filters}>
        {item.levels.map((l) => (
          <li key={l} className="tag tag-level">
            {t.levels[l]}
          </li>
        ))}
        {item.funding !== "unknown" && <li className={`tag tag-${item.funding}`}>{t.funding[item.funding]}</li>}
        {contentLang !== locale && <li className="tag tag-lang">{t.inLanguage[contentLang]}</li>}
      </ul>

      <div className="card-foot">
        <div className={`deadline deadline-${urgency}`}>
          {item.deadline ? (
            <>
              <span className="deadline-label">{t.deadline}</span>{" "}
              <time dateTime={item.deadline}>{formatDate(item.deadline, locale)}</time>
              <span className="deadline-left"> · {days! < 0 ? t.expired : t.daysLeft(days!)}</span>
            </>
          ) : item.sourceId === "official" ? (
            <span className="deadline-label annual-label">★ {t.annualBadge}</span>
          ) : (
            <span className="deadline-label">{t.noDeadline}</span>
          )}
        </div>
        <div className="card-meta">
          <span className="source">
            <bdi>{item.sourceId === "official" ? t.annual : item.sourceName}</bdi>
          </span>
          <a className="apply" href={item.url} target="_blank" rel="noopener noreferrer">
            {t.viewDetails}
            <span aria-hidden="true">{locale === "ar" ? " ←" : " →"}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
