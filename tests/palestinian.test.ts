import { describe, expect, it } from "vitest";
import { isRestrictedToOthers } from "@/lib/classify";
import { normalize } from "@/lib/scrapers/normalize";
import { parseWenakDetail, parseWenakList } from "@/lib/scrapers/wenak";
import { applyQuery } from "@/lib/store/filter";
import { officialSource } from "@/lib/scrapers/official";

describe("isRestrictedToOthers", () => {
  it.each([
    "NPC / TotalEnergies Scholarship 2027 for Nigerian students",
    "Africa Dyslexia Teacher Fellowship Program 2027",
    "The Gates Foundation AI Fellows Program 2027 for young African Innovators",
    "Commonwealth Shared Scholarships for Developing Countries 2027",
    "8 منح مجانية تقبل السودانيين",
    "منح للسوريين 2027",
  ])("drops %s", (title) => expect(isRestrictedToOthers(title)).toBe(true));

  it.each([
    "Erasmus Mundus Joint Master 2027 (Fully Funded)",
    "University of Cape Town Scholarships for International Students",
    "Rhodes Scholarship for Syria, Jordan, Lebanon & Palestine",
    "MENA Women in Tech Fellowship",
    "منحة للطلاب الفلسطينيين في غزة",
    "Chevening Scholarships 2027",
  ])("keeps %s", (title) => expect(isRestrictedToOthers(title)).toBe(false));

  it("makes normalize() skip restricted calls", () => {
    const src = { id: "s", name: "S" };
    expect(normalize({ url: "https://x.org/a", title: "Scholarship for Kenyan students", text: "" }, src, "2026-11-19T00:00:00Z")).toBeNull();
  });
});

const LIST = `
<div class="scholarship-card"><div class="scholarship-card__inner" onclick="window.location.href='https://www.wenak.ps/scholarships/single/1722'">
  <div class="scholarship-card__image"><img src="x.webp" alt="44 منحة من برنامج الماجستير المشترك بين اليابان والبنك الدولي"></div>
  <div class="scholarship-card__content"><div class="scholarship-card__meta"><div class="scholarship-card__tag">خارجي</div>
  <div class="scholarship-card__location"><i></i> استراليا, المملكة المتحدة </div></div>
  <h3 class="scholarship-card__title">عدة جامعات</h3></div></div></div>
<div class="scholarship-card"><div class="scholarship-card__inner" onclick="window.location.href='/scholarships/single/9'">
  <div class="scholarship-card__image"><img alt="منحة جامعة بيرزيت"></div>
  <div class="scholarship-card__tag">داخلي</div></div></div>`;

const DETAIL = `<h1 class="scholarship-title">44 منحة</h1>
<div class="deadline-badge"><span class="date-text"> تاريخ الانتهاء: 2026-12-19 </span></div>
<div class="scholarship-content"><p>تشمل البلدان المؤهلة: مصر، وفلسطين، واليمن.</p><p>تغطي المنحة الرسوم بالكامل.</p></div>`;

describe("wenak.ps parser", () => {
  it("parses listing cards", () => {
    const cards = parseWenakList(LIST);
    expect(cards).toEqual([
      { url: "https://www.wenak.ps/scholarships/single/1722", title: "44 منحة من برنامج الماجستير المشترك بين اليابان والبنك الدولي", countries: "استراليا, المملكة المتحدة", scope: "خارجي" },
      { url: "https://www.wenak.ps/scholarships/single/9", title: "منحة جامعة بيرزيت", countries: "", scope: "داخلي" },
    ]);
  });
  it("parses the deadline and description", () => {
    expect(parseWenakDetail(DETAIL)).toEqual({
      deadline: "2026-12-19",
      text: "تشمل البلدان المؤهلة: مصر، وفلسطين، واليمن.\nتغطي المنحة الرسوم بالكامل.",
    });
  });
});

describe("annual programmes", () => {
  it("are all valid opportunities and selectable with annual=1", async () => {
    const raws = await officialSource.fetch();
    const items = raws.map((r) => normalize(r, officialSource, "2026-11-19T00:00:00Z"));
    expect(items.every(Boolean)).toBe(true);
    expect(raws.length).toBeGreaterThanOrEqual(20);
    const all = [
      ...items.map((i) => i!),
      { ...items[0]!, id: "other", sourceId: "greatyop" },
    ];
    const r = applyQuery(all, { annual: true, pageSize: 100 }, new Date("2026-11-19T12:00:00Z"));
    expect(r.total).toBe(raws.length);
    expect(r.items.every((i) => i.sourceId === "official" && i.titleAr && i.summaryAr)).toBe(true);
  });
});
