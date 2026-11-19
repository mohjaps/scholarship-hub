import type { ContentLang, Funding, Kind, Level, PalestinianEligibility } from "./types";

/** Decode the HTML entities WordPress commonly emits and strip tags. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** Arabic-Indic and Persian digits → ASCII. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function detectLang(text: string): ContentLang {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (!letters) return "en";
  const arabic = (letters.match(/[؀-ۿ]/g) ?? []).length;
  if (arabic / letters.length > 0.3) return "ar";
  const fr = (text.match(/\b(les|des|pour|bourses?|études|d'études|à|être|candidature)\b/gi) ?? []).length;
  const en = (text.match(/\b(the|and|for|scholarships?|students?|apply|with)\b/gi) ?? []).length;
  return fr > en ? "fr" : "en";
}

// ---------------------------------------------------------------- levels

const LEVEL_PATTERNS: Record<Level, RegExp> = {
  bachelor:
    /\b(bachelor'?s?|undergraduates?|undergrad|b\.?sc|licence|premier cycle)\b|بكالوريوس|البكالوريوس|المرحلة الجامعية الأولى|الدراسة الجامعية|لطلاب الثانوية|بعد الثانوية/i,
  master:
    /\b(master'?s?|masters|postgraduate|post-graduate|graduate degree|m\.?sc|mba|llm|m\.?a\.? degree)\b|ماجستير|الماجستير|دراسات عليا|الدراسات العليا/i,
  phd: /\b(ph\.?\s?d|doctoral|doctorate|doctorat|dphil)\b|دكتوراه|الدكتوراه|دراسات عليا|الدراسات العليا/i,
};

export function detectLevels(text: string): Level[] {
  // "postdoctoral" is not a PhD programme.
  const t = text.replace(/post[- ]?doc(toral)?|ما بعد الدكتوراه|postdoctora[lt]/gi, " ");
  return (Object.keys(LEVEL_PATTERNS) as Level[]).filter((l) => LEVEL_PATTERNS[l].test(t));
}

// ---------------------------------------------------------------- kind

const KIND_PATTERNS: [Kind, RegExp][] = [
  ["internship", /\b(internships?|traineeships?|stage rémunéré)\b|تدريب عملي|تدريب صيفي مدفوع/i],
  ["fellowship", /\b(fellowships?|fellows)\b|زمالة|زمالات/i],
  ["conference", /\b(conferences?|summits?|congress|youth assembly|forum)\b|مؤتمر|قمة|ملتقى|منتدى/i],
  ["exchange", /\b(exchange|summer school|winter school|study tour|visiting (scholar|student)|school of)\b|تبادل|مدرسة صيفية|برنامج صيفي|زيارة دراسية|école d'été/i],
  ["scholarship", /\b(scholarships?|bursar(y|ies)|grants?|stipends?|fully[- ]funded|bourses?)\b|منحة|منح|ممولة/i],
  ["training", /\b(training|workshops?|bootcamp|academy|leadership program(me)?)\b|تدريب|ورشة|دورة تدريبية/i],
];

export function detectKind(text: string): Kind | null {
  for (const [kind, re] of KIND_PATTERNS) if (re.test(text)) return kind;
  return null;
}

/** Roundups, how-tos and visa guides are articles, not opportunities. */
const NOT_AN_OPPORTUNITY = new RegExp(
  [
    // English
    String.raw`\b(best courses|how to|tips|visa|guide|list of|top \d+|\d+\+? (new |best |fully[- ]funded )*(scholarships|fellowships|opportunities)|interview questions|cover letter|motivation letter|recommendation letter|\bsop\b|statement of purpose|difference between|vs\.?|explained|what is)\b`,
    // Arabic: guides, comparisons, roundups ("10 منح ...")
    String.raw`أفضل دورات|كيف|نصائح|تأشيرة|قائمة|أفضل \d+|دليل|خطوات|خطاب توصية|رسالة توصية|بيان شخصي|خطاب الدافع|سيرة ذاتية|ما الفرق|الفرق بين|قارن|مقارنة|ما هي|^\d+\s+(منح|منحة|فرص|جامعات)`,
    // French
    String.raw`\bcomment\b|conseils|lettre de motivation`,
  ].join("|"),
  "i",
);

/**
 * Judge only the headline before " | " or ": " — aggregators append SEO tails
 * like "| How to Apply" or ": Full Guide & Deadlines" to real scholarships.
 */
export function isArticleNotOpportunity(title: string): boolean {
  const head = title.split(/\s+[|–—]\s+|:\s+/)[0] || title;
  return NOT_AN_OPPORTUNITY.test(head);
}

// ---------------------------------------------------------------- funding

export function detectFunding(text: string): Funding {
  if (/fully[- ]funded|full(y)? (scholarship|funding|tuition)|full ride|ممولة بالكامل|منحة كاملة|تمويل كامل|entièrement financée?s?/i.test(text))
    return "full";
  if (/partial(ly)?[- ]funded|partial scholarship|tuition (fee )?(waiver|reduction|discount)|ممولة جزئيا|ممولة جزئياً|منحة جزئية|partiellement financée?s?/i.test(text))
    return "partial";
  return "unknown";
}

// ---------------------------------------------------------------- Palestinians

const PALESTINE_EXPLICIT = /palestin|\bgaza\b|west bank|فلسطين|فلسطيني|غزة|الضفة الغربية|القدس/i;
const OPEN_TO_ALL =
  /all nationalities|all countries|any country|any nationality|every country|worldwide|around the world|all over the world|international (students|applicants|candidates)|developing countries|low- and middle-income countries|arab (countries|world|region|students)|\bmena\b|middle east|global south|جميع الجنسيات|كل الجنسيات|جميع دول العالم|جميع الدول|الطلاب الدوليين|للطلاب الدوليين|الطلاب العرب|الدول العربية|الدول النامية|toutes (les )?nationalités|tous les pays|étudiants internationaux|pays en développement/i;

/** Nationalities/regions that, named in a title, usually mean "only for them". */
const OTHER_GROUPS = String.raw`africa|africans?|nigeria|nigerians?|kenya|kenyans?|ghana|ghanaians?|uganda|ugandans?|tanzanian?s?|rwandans?|zambians?|zimbabweans?|ethiopians?|cameroonians?|south africans?|indians?|pakistanis?|bangladeshis?|nepalese|sri lankans?|filipinos?|indonesians?|latin americans?|caribbean|pacific islanders?|us citizens|u\.s\. citizens|american (students|citizens)|canadian (students|citizens)|eu (students|citizens)|european students|uk (students|residents)|commonwealth|asean`;
const RESTRICTED_EN = new RegExp(String.raw`\b(${OTHER_GROUPS})\b`, "i");
const RESTRICTED_AR =
  /لل(سوريين|سودانيين|مصريين|يمنيين|عراقيين|أردنيين|اردنيين|لبنانيين|مغاربة|جزائريين|تونسيين|ليبيين|سعوديين|إماراتيين|كويتيين|قطريين|عمانيين|بحرينيين|موريتانيين|نيجيريين|أفارقة)|(تقبل|خاصة ب|مخصصة ل)\s*(ال)?(سوريين|سودانيين|مصريين|يمنيين|عراقيين|أفارقة)/;
const INCLUSIVE =
  /international|worldwide|global|all (countries|nationalities)|developing countries|arab|mena|middle east|palestin|gaza|فلسطين|الفلسطينيين|غزة|جميع الجنسيات|الدوليين|العرب/i;

/**
 * True when the title says the call is for a specific other nationality or
 * region (e.g. "… for Nigerian students", "Africa … Fellowship", "منح للسوريين")
 * and does not also say it is international / Arab / Palestinian.
 */
export function isRestrictedToOthers(title: string): boolean {
  if (/palestin|gaza|فلسطين|الفلسطينيين|غزة/i.test(title)) return false;
  // Palestine is not a Commonwealth country, whatever else the title says.
  if (/commonwealth/i.test(title)) return true;
  if (INCLUSIVE.test(title)) return false;
  return RESTRICTED_EN.test(title) || RESTRICTED_AR.test(title);
}

export function detectPalestinian(text: string): PalestinianEligibility {
  if (PALESTINE_EXPLICIT.test(text)) return "explicit";
  if (OPEN_TO_ALL.test(text)) return "open";
  return "unknown";
}

// ---------------------------------------------------------------- deadline

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, janvier: 1, "يناير": 1, "كانون الثاني": 1, "جانفي": 1,
  feb: 2, february: 2, "février": 2, fevrier: 2, "فبراير": 2, "شباط": 2, "فيفري": 2,
  mar: 3, march: 3, mars: 3, "مارس": 3, "آذار": 3,
  apr: 4, april: 4, avril: 4, "أبريل": 4, "ابريل": 4, "إبريل": 4, "نيسان": 4, "أفريل": 4,
  may: 5, mai: 5, "مايو": 5, "أيار": 5, "ماي": 5,
  jun: 6, june: 6, juin: 6, "يونيو": 6, "حزيران": 6, "جوان": 6,
  jul: 7, july: 7, juillet: 7, "يوليو": 7, "تموز": 7, "جويلية": 7,
  aug: 8, august: 8, "août": 8, aout: 8, "أغسطس": 8, "اغسطس": 8, "آب": 8, "أوت": 8,
  sep: 9, sept: 9, september: 9, septembre: 9, "سبتمبر": 9, "أيلول": 9,
  oct: 10, october: 10, octobre: 10, "أكتوبر": 10, "اكتوبر": 10, "تشرين الأول": 10,
  nov: 11, november: 11, novembre: 11, "نوفمبر": 11, "تشرين الثاني": 11,
  dec: 12, december: 12, "décembre": 12, decembre: 12, "ديسمبر": 12, "كانون الأول": 12,
};

const MONTH_ALT = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const DEADLINE_KEYWORD =
  /deadline|closing date|apply by|applications? close|due date|date limite|آخر موعد|اخر موعد|الموعد النهائي|موعد التقديم|موعد انتهاء|تاريخ الإغلاق|الموعد الأخير|ينتهي التقديم/gi;

function iso(y: number, m: number, d: number): string | null {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString().slice(0, 10);
}

/** Parse the first date in a short text window. */
export function parseDate(window: string): string | null {
  const w = normalizeDigits(window).replace(/[،,]/g, " ").replace(/\s+/g, " ");
  let m = w.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  // 15 January 2027 / 15th of January, 2027 / 15 يناير 2027
  m = w.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th|er)?(?: of)? (${MONTH_ALT})\\.? (\\d{4})`, "i"));
  if (m) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  // January 15, 2027
  m = w.match(new RegExp(`(${MONTH_ALT})\\.? (\\d{1,2})(?:st|nd|rd|th)? (\\d{4})`, "i"));
  if (m) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  // 15/01/2027 or 15.01.2027 (day first; the sources are mostly non-US)
  m = w.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (m) return +m[2] > 12 ? iso(+m[3], +m[1], +m[2]) : iso(+m[3], +m[2], +m[1]);
  return null;
}

export function detectDeadline(text: string): string | null {
  for (const match of text.matchAll(DEADLINE_KEYWORD)) {
    const start = (match.index ?? 0) + match[0].length;
    const found = parseDate(text.slice(start, start + 90));
    if (found) return found;
  }
  return null;
}

export function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd() + "…";
}
