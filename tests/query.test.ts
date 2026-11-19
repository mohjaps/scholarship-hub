import { describe, expect, it } from "vitest";
import { parseQuery, toSearchParams } from "@/lib/params";
import { applyQuery } from "@/lib/store/filter";
import { buildWhere } from "@/lib/store/postgres";
import type { Opportunity } from "@/lib/types";

const now = new Date("2026-11-19T12:00:00Z");
const base: Opportunity = {
  id: "x", sourceId: "s", sourceName: "S", url: "https://x", title: "T", summary: "", lang: "en",
  kind: "scholarship", levels: [], funding: "unknown", palestinian: "unknown", deadline: null,
  publishedAt: null, scrapedAt: "2026-11-19T00:00:00Z",
};
const items: Opportunity[] = [
  { ...base, id: "soon", title: "Soon master", levels: ["master"], deadline: "2026-11-25", palestinian: "open" },
  { ...base, id: "later", title: "Later PhD", levels: ["phd"], deadline: "2027-03-01", palestinian: "explicit" },
  { ...base, id: "nodl", title: "No deadline منحة", levels: ["bachelor"], publishedAt: "2026-11-01T00:00:00Z" },
  { ...base, id: "expired", title: "Expired", deadline: "2026-10-01" },
  { ...base, id: "stale", title: "Stale", scrapedAt: "2026-01-01T00:00:00Z" },
];

describe("applyQuery", () => {
  it("orders upcoming deadlines first and hides expired and stale items", () => {
    expect(applyQuery(items, {}, now).items.map((i) => i.id)).toEqual(["soon", "later", "nodl"]);
  });
  it("can include expired items (last)", () => {
    expect(applyQuery(items, { includeExpired: true }, now).items.map((i) => i.id)).toEqual(["soon", "later", "nodl", "expired"]);
  });
  it("filters by level, Palestinian eligibility and text", () => {
    expect(applyQuery(items, { level: "phd" }, now).items.map((i) => i.id)).toEqual(["later"]);
    expect(applyQuery(items, { palestinian: "eligible" }, now).items.map((i) => i.id)).toEqual(["soon", "later"]);
    expect(applyQuery(items, { palestinian: "explicit" }, now).items.map((i) => i.id)).toEqual(["later"]);
    expect(applyQuery(items, { q: "منحة" }, now).items.map((i) => i.id)).toEqual(["nodl"]);
  });
  it("paginates", () => {
    const r = applyQuery(items, { page: 2, pageSize: 2 }, now);
    expect(r.items.map((i) => i.id)).toEqual(["nodl"]);
    expect(r.total).toBe(3);
  });
});

describe("parseQuery", () => {
  it("validates input and round-trips", () => {
    const q = parseQuery({ level: "phd", kind: "nope", palestinian: "eligible", page: "-3", expired: "1", q: " gaza " });
    expect(q).toMatchObject({ level: "phd", kind: undefined, palestinian: "eligible", page: 1, includeExpired: true, q: "gaza" });
    expect(parseQuery(toSearchParams(q))).toEqual(q);
  });
});

describe("buildWhere", () => {
  it("parameterizes every user value", () => {
    const { where, params } = buildWhere({ q: "50%_off'; drop table x", level: "master", source: "s" }, now);
    expect(where).not.toContain("drop table");
    expect(params).toContain("%50\\%\\_off'; drop table x%");
    // Every parameter must be referenced: Postgres rejects unused untyped params.
    params.forEach((_, i) => expect(where).toContain("$" + (i + 1)));
  });
});
