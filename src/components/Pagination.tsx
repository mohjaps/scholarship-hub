import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { pageList } from "@/lib/pagination";

export function Pagination({
  page,
  pages,
  hrefFor,
  t,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
  t: Dictionary;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label={t.pagination}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="pager-step">
          {t.prev}
        </Link>
      ) : (
        <span className="pager-step" aria-disabled="true">
          {t.prev}
        </span>
      )}
      <ol className="pager-pages">
        {pageList(page, pages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="pager-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link href={hrefFor(p)} aria-current={p === page ? "page" : undefined} aria-label={t.page(p, pages)}>
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next" className="pager-step">
          {t.next}
        </Link>
      ) : (
        <span className="pager-step" aria-disabled="true">
          {t.next}
        </span>
      )}
    </nav>
  );
}
