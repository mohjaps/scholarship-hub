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
