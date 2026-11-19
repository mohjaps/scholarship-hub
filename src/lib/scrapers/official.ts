import type { RawItem } from "./normalize";
import type { Source } from "./source";

/**
 * Major government programmes. Their sites are JS-heavy or change layout
 * often, so they are kept as a curated list instead of scraped. Deadlines are
 * left empty on purpose: they move every cycle, so the card links to the
 * official page instead of showing a stale date.
 *
 * "palestinian: explicit" is only set where the programme runs a Palestine
 * track. Verify and extend this list as needed.
 */
const PROGRAMMES: RawItem[] = [
  {
    url: "https://www.chevening.org/scholarships/",
    title: "Chevening Scholarships (UK)",
    titleAr: "منح تشيفنينغ (المملكة المتحدة)",
    text: "",
    excerpt:
      "UK government scholarship for a one-year master's degree at any UK university. It covers tuition, a living allowance and flights. The Occupied Palestinian Territories are an eligible country.",
    summaryAr:
      "منحة الحكومة البريطانية لدراسة ماجستير لمدة سنة في أي جامعة بريطانية، تغطي الرسوم والمعيشة وتذاكر السفر. الأراضي الفلسطينية من الدول المؤهلة.",
    kind: "scholarship",
    levels: ["master"],
    funding: "full",
    palestinian: "explicit",
    deadline: null,
  },
  {
    url: "https://foreign.fulbrightonline.org/",
    title: "Fulbright Foreign Student Program (USA)",
    titleAr: "برنامج فولبرايت للطلاب الأجانب (الولايات المتحدة)",
    text: "",
    excerpt:
      "Master's and PhD study in the United States, run through U.S. embassies and binational commissions. Palestinian applicants apply through the Fulbright program for the Palestinian Territories (AMIDEAST).",
    summaryAr:
      "دراسة الماجستير والدكتوراه في الولايات المتحدة عبر السفارات واللجان الثنائية. يتقدّم الفلسطينيون عبر برنامج فولبرايت للأراضي الفلسطينية (أميدست).",
    kind: "scholarship",
    levels: ["master", "phd"],
    funding: "full",
    palestinian: "explicit",
    deadline: null,
  },
  {
    url: "https://www.turkiyeburslari.gov.tr/",
    title: "Türkiye Scholarships (Türkiye Bursları)",
    titleAr: "المنح التركية (Türkiye Bursları)",
    text: "",
    excerpt:
      "Turkish government scholarship for bachelor's, master's and PhD degrees. It covers tuition, a monthly stipend, accommodation, health insurance, flights and a Turkish language year. Open to all countries.",
    summaryAr:
      "منحة الحكومة التركية للبكالوريوس والماجستير والدكتوراه، تشمل الرسوم وراتبًا شهريًا والسكن والتأمين الصحي وتذاكر الطيران وسنة لغة تركية. مفتوحة لجميع الدول.",
    kind: "scholarship",
    levels: ["bachelor", "master", "phd"],
    funding: "full",
    palestinian: "open",
    deadline: null,
  },
  {
    url: "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/",
    title: "DAAD Scholarship Database (Germany)",
    titleAr: "قاعدة بيانات منح DAAD (ألمانيا)",
    text: "",
    excerpt:
      "The German Academic Exchange Service's database of funding for master's, PhD and research stays in Germany. Filter it by your country of origin.",
    summaryAr:
      "قاعدة بيانات الهيئة الألمانية للتبادل الأكاديمي لمنح الماجستير والدكتوراه والإقامات البحثية في ألمانيا. يمكن التصفية حسب بلد المنشأ.",
    kind: "scholarship",
    levels: ["master", "phd"],
    funding: "full",
    palestinian: "open",
    deadline: null,
  },
  {
    url: "https://www.studyinkorea.go.kr/",
    title: "Global Korea Scholarship (GKS)",
    titleAr: "منحة كوريا العالمية (GKS)",
    text: "",
    excerpt:
      "Korean government scholarship for undergraduate and graduate degrees. It covers tuition, flights, a monthly allowance and a year of Korean language. Eligible countries change every year.",
    summaryAr:
      "منحة الحكومة الكورية للبكالوريوس والدراسات العليا، تشمل الرسوم والطيران وراتبًا شهريًا وسنة لغة كورية. قائمة الدول المؤهلة تتغير سنويًا.",
    kind: "scholarship",
    levels: ["bachelor", "master", "phd"],
    funding: "full",
    palestinian: "unknown",
    deadline: null,
  },
  {
    url: "https://www.studyinjapan.go.jp/en/",
    title: "MEXT Japanese Government Scholarship",
    titleAr: "منحة الحكومة اليابانية (MEXT)",
    text: "",
    excerpt:
      "Japanese government scholarship for undergraduate, master's and PhD study. You apply through the Japanese embassy or by university recommendation.",
    summaryAr:
      "منحة الحكومة اليابانية للبكالوريوس والماجستير والدكتوراه، والتقديم عبر السفارة اليابانية أو بترشيح من الجامعة.",
    kind: "scholarship",
    levels: ["bachelor", "master", "phd"],
    funding: "full",
    palestinian: "unknown",
    deadline: null,
  },
  {
    url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    title: "Erasmus Mundus Joint Masters (EU)",
    titleAr: "ماجستير إيراسموس موندوس المشترك (الاتحاد الأوروبي)",
    text: "",
    excerpt:
      "Fully funded joint master's degrees taught in two or more European countries, open to students of every nationality. Each programme sets its own deadline, usually between October and January.",
    summaryAr:
      "برامج ماجستير مشتركة ممولة بالكامل تُدرَّس في دولتين أوروبيتين أو أكثر، ومفتوحة لجميع الجنسيات. لكل برنامج موعده، وغالبًا بين أكتوبر ويناير.",
    kind: "scholarship",
    levels: ["master"],
    funding: "full",
    palestinian: "open",
    deadline: null,
  },
];

export const officialSource: Source = {
  id: "official",
  name: "Official programmes",
  homepage: "https://www.chevening.org/",
  region: "official",
  async fetch() {
    return PROGRAMMES;
  },
};
