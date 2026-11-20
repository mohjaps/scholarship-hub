import { describe, expect, it } from "vitest";
import { canonicalUrl, idFor, normalize } from "@/lib/scrapers/normalize";

const src = { id: "test", name: "Test" };
const at = "2026-11-19T00:00:00.000Z";

describe("normalize", () => {
  it("builds an opportunity from a scraped post", () => {
    const o = normalize(
      {
        url: "https://example.org/scholarship/?utm_source=x#top",
        title: "Example University Master's Scholarship 2027 (Fully Funded)",
        text: "Open to all nationalities, including Palestinian students. Application deadline: 1 February 2027.",
        excerpt: "A fully funded master's scholarship.",
      },
      src,
      at,
    )!;
    expect(o).toMatchObject({
      url: "https://example.org/scholarship",
      kind: "scholarship",
      levels: ["master"],
      funding: "full",
      palestinian: "explicit",
      deadline: "2027-02-01",
      lang: "en",
    });
    expect(o.id).toBe(idFor("https://example.org/scholarship"));
  });

  it("uses the title before category hints for the kind", () => {
    const o = normalize({ url: "https://x.org/a", title: "Health Impact Fellowship", text: "", hints: ["Conferences"] }, src, at)!;
    expect(o.kind).toBe("fellowship");
  });

  it("returns null for guides and for posts that are not opportunities", () => {
    expect(normalize({ url: "https://x.org/a", title: "How to win a scholarship", text: "" }, src, at)).toBeNull();
    expect(normalize({ url: "https://x.org/b", title: "Austria student life", text: "" }, src, at)).toBeNull();
  });

  it("canonicalizes urls", () => {
    expect(canonicalUrl("https://a.org/x/?fbclid=1&id=2")).toBe("https://a.org/x/?id=2");
  });
});

import { dedupeKey, mergeDuplicates } from "@/lib/scrapers/normalize";
import type { Opportunity } from "@/lib/types";

describe("duplicates across aggregators", () => {
  const base: Opportunity = {
    id: "a", sourceId: "s1", sourceName: "S1", url: "https://a", title: "", summary: "", lang: "en",
    kind: "scholarship", levels: [], funding: "unknown", palestinian: "unknown", deadline: null,
    publishedAt: null, scrapedAt: "2026-11-19T00:00:00Z",
  };
  it("gives the same key to reworded copies", () => {
    expect(dedupeKey("CERN Summer Student Program 2027 in Switzerland (Fully Funded)")).toBe(
      dedupeKey("CERN Summer Student Program 2027 in Switzerland | Paid"),
    );
    expect(dedupeKey("University of Oulu Scholarship")).not.toBe(dedupeKey("University of Tokyo Scholarship"));
  });
  it("merges copies, keeping the dated one and combining signals", () => {
    const merged = mergeDuplicates([
      { ...base, id: "1", title: "CERN Summer Student Program 2027 (Fully Funded)", levels: ["bachelor"], palestinian: "open", funding: "full" },
      { ...base, id: "2", sourceId: "s2", title: "CERN Summer Student Program 2027 | How to Apply", levels: ["master"], deadline: "2027-01-31" },
      { ...base, id: "3", sourceId: "official", title: "CERN Summer Student Program" },
    ]);
    expect(merged).toHaveLength(2);
    const m = merged.find((o) => o.sourceId !== "official")!;
    expect(m).toMatchObject({ id: "2", deadline: "2027-01-31", levels: ["bachelor", "master"], palestinian: "open", funding: "full" });
  });
});
