import type { ContentLang, Funding, Kind, Level } from "@/lib/types";

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

const ar = {
  siteName: "بوابة المنح",
  tagline: "منح البكالوريوس والماجستير والدكتوراه وفرص السفر، تُجمع يوميًا من مواقع عربية وعالمية ورسمية.",
  searchPlaceholder: "ابحث باسم المنحة أو الدولة أو الجامعة…",
  search: "بحث",
  filters: "التصفية",
  allLevels: "كل المراحل",
  allKinds: "كل الأنواع",
  anyLanguage: "أي لغة",
  anySource: "كل المصادر",
  palestinianFilter: "للفلسطينيين",
  palestinianAny: "الكل",
  palestinianEligible: "متاحة للفلسطينيين",
  palestinianExplicit: "تذكر فلسطين صراحةً",
  includeExpired: "إظهار المنتهية",
  reset: "مسح",
  results: (n: number) => (n === 0 ? "لا توجد نتائج" : n === 1 ? "نتيجة واحدة" : n === 2 ? "نتيجتان" : n <= 10 ? `${n} نتائج` : `${n} نتيجة`),
  empty: "لم نجد فرصًا مطابقة. جرّب إزالة بعض الفلاتر.",
  emptyNoData: "لا توجد بيانات بعد. شغّل الجامع عبر npm run scrape أو انتظر التحديث اليومي.",
  deadline: "آخر موعد",
  noDeadline: "الموعد غير محدد — راجع الصفحة الرسمية",
  daysLeft: (d: number) => (d === 0 ? "ينتهي اليوم" : d === 1 ? "بقي يوم واحد" : d === 2 ? "بقي يومان" : d <= 10 ? `بقيت ${d} أيام` : `بقي ${d} يومًا`),
  expired: "انتهى التقديم",
  published: "نُشرت",
  viewDetails: "التفاصيل والتقديم",
  source: "المصدر",
  inLanguage: { ar: "بالعربية", en: "بالإنجليزية", fr: "بالفرنسية" } satisfies Record<ContentLang, string>,
  languageName: { ar: "العربية", en: "الإنجليزية", fr: "الفرنسية" } satisfies Record<ContentLang, string>,
  levels: { bachelor: "بكالوريوس", master: "ماجستير", phd: "دكتوراه" } satisfies Record<Level, string>,
  kinds: {
    scholarship: "منحة دراسية",
    fellowship: "زمالة",
    exchange: "تبادل / مدرسة صيفية",
    conference: "مؤتمر",
    training: "تدريب",
    internship: "تدريب عملي",
  } satisfies Record<Kind, string>,
  funding: { full: "ممولة بالكامل", partial: "ممولة جزئيًا", unknown: "" } satisfies Record<Funding, string>,
  palestinianBadge: { explicit: "متاحة للفلسطينيين", open: "مفتوحة لجميع الجنسيات", unknown: "" },
  prev: "السابق",
  next: "التالي",
  pagination: "الصفحات",
  sync: "تحديث الآن",
  syncing: "جارٍ جلب المنح…",
  syncDone: (n: number) => `تم التحديث: ${n} فرصة`,
  syncCooldown: (m: number) => (m === 1 ? "تم التحديث للتو، حاول بعد دقيقة" : m === 2 ? "تم التحديث للتو، حاول بعد دقيقتين" : m <= 10 ? `تم التحديث للتو، حاول بعد ${m} دقائق` : `تم التحديث للتو، حاول بعد ${m} دقيقة`),
  syncError: "تعذّر التحديث، حاول لاحقًا",
  page: (p: number, of: number) => `صفحة ${p} من ${of}`,
  lastUpdated: "آخر تحديث",
  sources: "المصادر",
  disclaimer:
    "تُجمع البيانات آليًا وقد تحتوي أخطاء في المواعيد أو شروط الأهلية. تحقّق دائمًا من الصفحة الرسمية قبل التقديم.",
  switchLanguage: "English",
  skipToResults: "انتقل إلى النتائج",
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  siteName: "Scholarship Hub",
  tagline: "Bachelor's, master's and PhD scholarships, plus travel opportunities, collected daily from Arab, global and official sources.",
  searchPlaceholder: "Search by scholarship, country or university…",
  search: "Search",
  filters: "Filters",
  allLevels: "All levels",
  allKinds: "All types",
  anyLanguage: "Any language",
  anySource: "All sources",
  palestinianFilter: "For Palestinians",
  palestinianAny: "All",
  palestinianEligible: "Open to Palestinians",
  palestinianExplicit: "Mentions Palestine explicitly",
  includeExpired: "Show expired",
  reset: "Clear",
  results: (n: number) => (n === 1 ? "1 result" : `${n} results`),
  empty: "No matching opportunities. Try removing some filters.",
  emptyNoData: "No data yet. Run the scraper with npm run scrape, or wait for the daily update.",
  deadline: "Deadline",
  noDeadline: "Deadline not listed. Check the official page.",
  daysLeft: (d: number) => (d === 0 ? "Closes today" : d === 1 ? "1 day left" : `${d} days left`),
  expired: "Closed",
  published: "Posted",
  viewDetails: "Details & apply",
  source: "Source",
  inLanguage: { ar: "In Arabic", en: "In English", fr: "In French" },
  languageName: { ar: "Arabic", en: "English", fr: "French" },
  levels: { bachelor: "Bachelor's", master: "Master's", phd: "PhD" },
  kinds: {
    scholarship: "Scholarship",
    fellowship: "Fellowship",
    exchange: "Exchange / summer school",
    conference: "Conference",
    training: "Training",
    internship: "Internship",
  },
  funding: { full: "Fully funded", partial: "Partially funded", unknown: "" },
  palestinianBadge: { explicit: "Open to Palestinians", open: "All nationalities", unknown: "" },
  prev: "Previous",
  next: "Next",
  pagination: "Pages",
  sync: "Sync now",
  syncing: "Fetching scholarships…",
  syncDone: (n: number) => `Updated: ${n} opportunities`,
  syncCooldown: (m: number) => `Synced recently. Try again in ${m} min`,
  syncError: "Sync failed. Try again later",
  page: (p: number, of: number) => `Page ${p} of ${of}`,
  lastUpdated: "Last updated",
  sources: "Sources",
  disclaimer:
    "Data is collected automatically and may have mistakes in deadlines or eligibility. Always check the official page before applying.",
  switchLanguage: "العربية",
  skipToResults: "Skip to results",
};

export const dictionaries: Record<Locale, Dictionary> = { ar, en };
