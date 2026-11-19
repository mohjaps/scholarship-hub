import { describe, expect, it } from "vitest";
import {
  detectDeadline,
  detectFunding,
  detectKind,
  detectLang,
  detectLevels,
  detectPalestinian,
  htmlToText,
  isArticleNotOpportunity,
  parseDate,
} from "@/lib/classify";

describe("detectDeadline", () => {
  it.each([
    ["Application Deadline: 15 January 2027", "2027-01-15"],
    ["Deadline: January 15, 2027.", "2027-01-15"],
    ["The deadline is the 1st of March, 2027", "2027-03-01"],
    ["Closing date: 2027-02-28", "2027-02-28"],
    ["Deadline: 31/12/2026", "2026-12-31"],
    ["آخر موعد للتقديم: 15 يناير 2027", "2027-01-15"],
    ["الموعد النهائي: ٢٠ شباط ٢٠٢٧", "2027-02-20"],
    ["Date limite : 3 mars 2027", "2027-03-03"],
  ])("%s → %s", (text, expected) => {
    expect(detectDeadline(text)).toBe(expected);
  });

  it("ignores dates that are not near a deadline keyword", () => {
    expect(detectDeadline("Published 15 January 2027. Study starts in September.")).toBeNull();
  });

  it("rejects impossible dates", () => {
    expect(parseDate("31 February 2027")).toBeNull();
  });
});

describe("detectLevels", () => {
  it("finds every level in English, Arabic and French", () => {
    expect(detectLevels("Fully funded Master's and PhD scholarships")).toEqual(["master", "phd"]);
    expect(detectLevels("منح البكالوريوس والماجستير والدكتوراه")).toEqual(["bachelor", "master", "phd"]);
    expect(detectLevels("Bourse de Licence et Doctorat")).toEqual(["bachelor", "phd"]);
    expect(detectLevels("Undergraduate scholarship")).toEqual(["bachelor"]);
  });

  it("does not treat postdoctoral as PhD", () => {
    expect(detectLevels("Postdoctoral fellowship")).toEqual([]);
    expect(detectLevels("منحة ما بعد الدكتوراه")).toEqual([]);
  });
});

describe("detectPalestinian", () => {
  it("is explicit when Palestine is named", () => {
    expect(detectPalestinian("Open to applicants from Jordan, Lebanon and Palestine")).toBe("explicit");
    expect(detectPalestinian("مخصصة لطلاب غزة")).toBe("explicit");
  });
  it("is open for all-nationality calls", () => {
    expect(detectPalestinian("Open to all nationalities")).toBe("open");
    expect(detectPalestinian("متاحة لجميع الجنسيات")).toBe("open");
  });
  it("is unknown otherwise", () => {
    expect(detectPalestinian("For Nigerian citizens only")).toBe("unknown");
  });
});

describe("detectKind / articles", () => {
  it("classifies opportunity types", () => {
    expect(detectKind("Erasmus Mundus Scholarship 2027")).toBe("scholarship");
    expect(detectKind("Chatham House Research Fellowship")).toBe("fellowship");
    expect(detectKind("Oxford Summer School 2027 (fully funded)")).toBe("exchange");
    expect(detectKind("One Young World Summit 2027")).toBe("conference");
    expect(detectKind("مؤتمر الشباب العربي")).toBe("conference");
    expect(detectKind("منحة الحكومة التركية")).toBe("scholarship");
    expect(detectKind("Young Leaders Fellowship to the 2027 Youth Assembly")).toBe("fellowship");
    expect(detectKind("Austria travel")).toBeNull();
  });

  it("drops guides and roundups", () => {
    expect(isArticleNotOpportunity("How to write a motivation letter")).toBe(true);
    expect(isArticleNotOpportunity("10+ New Scholarships for International Students")).toBe(true);
    expect(isArticleNotOpportunity("ما الفرق بين المنحة الكاملة والمنحة الجزئية؟")).toBe(true);
    expect(isArticleNotOpportunity("8 منح مجانية تقبل السودانيين")).toBe(true);
    expect(isArticleNotOpportunity("أفضل دورات CEH في قطر 2027")).toBe(true);
    expect(isArticleNotOpportunity("Chevening Scholarships 2027")).toBe(false);
    expect(isArticleNotOpportunity("منحة الحكومة التركية 2027")).toBe(false);
  });
});

describe("misc", () => {
  it("detects funding", () => {
    expect(detectFunding("A fully-funded programme")).toBe("full");
    expect(detectFunding("منحة ممولة بالكامل")).toBe("full");
    expect(detectFunding("50% tuition waiver")).toBe("partial");
    expect(detectFunding("A scholarship")).toBe("unknown");
  });
  it("detects language", () => {
    expect(detectLang("منحة دراسية ممولة بالكامل")).toBe("ar");
    expect(detectLang("Bourse d'études pour les étudiants")).toBe("fr");
    expect(detectLang("Scholarship for students")).toBe("en");
  });
  it("strips html and decodes entities", () => {
    expect(htmlToText("<p>Tom &amp; Jerry&#8217;s <b>grant</b></p><script>x()</script>")).toBe("Tom & Jerry’s grant");
  });
});
