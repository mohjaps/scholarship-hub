import { describe, expect, it } from "vitest";
import { parseCataloguePage } from "@/lib/scrapers/erasmus";
import { cleanExcerpt, wpPostToRaw, wpPostsUrl } from "@/lib/scrapers/wordpress";

// Trimmed copy of the EACEA catalogue markup (Europa Component Library cards).
const CATALOGUE = `
<article class="ecl-card"><div class="ecl-card__body"><div class="ecl-content-block ecl-card__content-block">
  <div class="ecl-content-block__title"><a href="https://www.quanteem.eu/" class="ecl-link">
    <span class="ecl-link__label">Quantum Technologies and Engineering Erasmus Mundus Master Plus</span></a></div>
  <div class="ecl-content-block__description"><p>QuanTEEM plus - Project overview<br />
    <a href="https://erasmus-plus.ec.europa.eu/projects/search/details/101325739">link</a></p></div>
</div></div></article>
<article class="ecl-card"><div class="ecl-card__body"><div class="ecl-content-block">
  <div class="ecl-content-block__title"><a href="https://microscom.eu/" class="ecl-link">
    <span class="ecl-link__label">Erasmus Mundus Joint Master Degree in Advanced Microscopy</span></a></div>
  <div class="ecl-content-block__description"><p>MICROSCOM - Project overview</p></div>
</div></div></article>
<nav><a href="?page=1">2</a><a href="?page=9">Last</a></nav>`;

describe("Erasmus catalogue parser", () => {
  it("extracts programmes and the last page", () => {
    const { items, lastPage } = parseCataloguePage(CATALOGUE);
    expect(lastPage).toBe(9);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      url: "https://www.quanteem.eu/",
      title: "Quantum Technologies and Engineering Erasmus Mundus Master Plus",
      levels: ["master"],
      funding: "full",
      palestinian: "open",
    });
    expect(items[0].excerpt).toContain("(QuanTEEM plus)");
  });
});

describe("WordPress source", () => {
  it("builds the REST url with category filters", () => {
    const url = new URL(
      wpPostsUrl({ id: "x", name: "X", homepage: "", region: "global", base: "https://x.org", categories: [1, 2], withContent: false }),
    );
    expect(url.pathname).toBe("/wp-json/wp/v2/posts");
    expect(url.searchParams.get("categories")).toBe("1,2");
    expect(url.searchParams.get("_fields")).not.toContain("content");
  });

  it("maps a post to a raw item", () => {
    const raw = wpPostToRaw(
      {
        id: 1,
        link: "https://x.org/post",
        date_gmt: "2026-11-18T10:00:00",
        title: { rendered: "Erasmus Mundus EMLE Scholarship 2027&#8211;29" },
        excerpt: { rendered: "<p>Fully funded master&#8217;s [&hellip;]</p><p>The post X appeared first on Y.</p>" },
        content: { rendered: "<p>Deadline: 15 January 2027</p>" },
        categories: [5],
      },
      new Map([[5, "Scholarships"]]),
    );
    expect(raw).toMatchObject({
      title: "Erasmus Mundus EMLE Scholarship 2027–29",
      text: "Deadline: 15 January 2027",
      excerpt: "Fully funded master’s",
      publishedAt: "2026-11-18T10:00:00.000Z",
      hints: ["Scholarships"],
    });
  });

  it("cleans excerpts", () => {
    expect(cleanExcerpt("<p>Apply now. Read more &raquo;</p>")).toBe("Apply now.");
  });
});

describe("customised WordPress APIs (youthop)", () => {
  it("handles string titles, missing links and unix deadlines", () => {
    const raw = wpPostToRaw(
      { id: "59747", title: "Global Thinkers Forum Mentoring Programme 2027", deadline: "1795478340", category: { name: "Fellowships" }, region: "Online" },
      new Map(),
      "https://www.youthop.com",
    );
    expect(raw).toMatchObject({
      url: "https://www.youthop.com/?p=59747",
      title: "Global Thinkers Forum Mentoring Programme 2027",
      deadline: "2026-11-23",
      hints: ["Fellowships"],
      publishedAt: null,
    });
  });
});
