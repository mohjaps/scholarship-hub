import { ANNUAL_SOURCE_ID } from "../store/filter";
import type { Level, PalestinianEligibility } from "../types";
import type { RawItem } from "./normalize";
import type { Source } from "./source";

/**
 * Annual scholarship programmes: they open every year at roughly the same
 * time. Kept as a curated list (their sites are JS-heavy or change often).
 * Exact deadlines move every cycle, so cards show the usual window and link
 * to the official page instead of a date that may be stale.
 *
 * palestinian: "explicit" only where the programme runs a Palestine track or
 * lists Palestine as eligible; "open" where any nationality may apply;
 * "unknown" where eligible countries vary year to year.
 */
interface Programme {
  url: string;
  en: string;
  ar: string;
  levels: Level[];
  palestinian: PalestinianEligibility;
  funding?: "full" | "partial";
  windowEn: string;
  windowAr: string;
  aboutEn: string;
  aboutAr: string;
}

const PROGRAMMES: Programme[] = [
  // ---- Explicitly for / open to Palestinians
  {
    url: "https://www.chevening.org/scholarships/",
    en: "Chevening Scholarships (UK)", ar: "منح تشيفنينغ (المملكة المتحدة)",
    levels: ["master"], palestinian: "explicit",
    windowEn: "Usually opens in August and closes in early November.",
    windowAr: "يفتح التقديم عادةً في أغسطس ويغلق مطلع نوفمبر.",
    aboutEn: "UK government award for a one-year master's at any UK university, covering tuition, living costs and flights. The Occupied Palestinian Territories are an eligible country.",
    aboutAr: "منحة الحكومة البريطانية لماجستير لمدة سنة في أي جامعة بريطانية تغطي الرسوم والمعيشة والطيران. الأراضي الفلسطينية من الدول المؤهلة.",
  },
  {
    url: "https://foreign.fulbrightonline.org/",
    en: "Fulbright Foreign Student Program (USA)", ar: "برنامج فولبرايت للطلاب الأجانب (الولايات المتحدة)",
    levels: ["master", "phd"], palestinian: "explicit",
    windowEn: "Dates vary by country. Palestinian applicants apply through the Fulbright program for the Palestinian Territories (AMIDEAST).",
    windowAr: "تختلف المواعيد حسب الدولة. يتقدّم الفلسطينيون عبر برنامج فولبرايت للأراضي الفلسطينية (أميدست).",
    aboutEn: "Master's and PhD study in the United States, fully funded.",
    aboutAr: "دراسة الماجستير والدكتوراه في الولايات المتحدة بتمويل كامل.",
  },
  {
    url: "https://www.rhodeshouse.ox.ac.uk/",
    en: "Rhodes Scholarship for Syria, Jordan, Lebanon & Palestine (Oxford)", ar: "منحة رودس لسوريا والأردن ولبنان وفلسطين (أكسفورد)",
    levels: ["master", "phd"], palestinian: "explicit",
    windowEn: "Opens once a year. Check the dates for this constituency on the Rhodes House site.",
    windowAr: "يفتح مرة سنويًا، وتُعلن مواعيد هذه الدائرة على موقع رودس هاوس.",
    aboutEn: "Fully funded postgraduate study at the University of Oxford, with a dedicated constituency for Palestinian candidates.",
    aboutAr: "دراسات عليا ممولة بالكامل في جامعة أكسفورد، مع دائرة مخصصة تشمل المرشحين الفلسطينيين.",
  },
  {
    url: "https://www.isdb.org/scholarships",
    en: "Islamic Development Bank (IsDB) Scholarships", ar: "منح البنك الإسلامي للتنمية (IsDB)",
    levels: ["bachelor", "master", "phd"], palestinian: "explicit",
    windowEn: "Usually announced at the end of the year, with a deadline in January to March.",
    windowAr: "يُعلن عادةً نهاية العام ويغلق بين يناير ومارس.",
    aboutEn: "Scholarships for students from IsDB member countries, including Palestine. They cover tuition, a monthly allowance, housing and health insurance.",
    aboutAr: "منح لطلاب الدول الأعضاء ومنها فلسطين، تشمل الرسوم وراتبًا شهريًا والسكن والتأمين الصحي.",
  },
  {
    url: "https://www.saidfoundation.org/",
    en: "Said Foundation Scholarships (UK)", ar: "منح مؤسسة سعيد (المملكة المتحدة)",
    levels: ["master"], palestinian: "explicit",
    windowEn: "Opens once a year. Check the foundation's site for the current round.",
    windowAr: "يفتح مرة سنويًا، وتُعلن الدورة الحالية على موقع المؤسسة.",
    aboutEn: "Master's scholarships in the UK for students from Palestine, Jordan, Lebanon and Syria.",
    aboutAr: "منح ماجستير في بريطانيا لطلاب من فلسطين والأردن ولبنان وسوريا.",
  },
  {
    url: "https://www.taawon.org/",
    en: "Taawon (Welfare Association) Student Support", ar: "مؤسسة التعاون: دعم الطلبة",
    levels: ["bachelor", "master"], palestinian: "explicit", funding: "partial",
    windowEn: "Calls open each academic year. Check Taawon's site.",
    windowAr: "تفتح الدعوات كل عام دراسي، راجع موقع مؤسسة التعاون.",
    aboutEn: "Palestinian foundation supporting Palestinian students with scholarships and student loans.",
    aboutAr: "مؤسسة فلسطينية تدعم الطلبة الفلسطينيين بالمنح والقروض الطلابية.",
  },
  // ---- Open to all nationalities
  {
    url: "https://www.turkiyeburslari.gov.tr/",
    en: "Türkiye Scholarships (Türkiye Bursları)", ar: "المنح التركية (Türkiye Bursları)",
    levels: ["bachelor", "master", "phd"], palestinian: "open",
    windowEn: "Usually open from 10 January to 20 February.",
    windowAr: "يفتح التقديم عادةً من 10 يناير حتى 20 فبراير.",
    aboutEn: "Covers tuition, a monthly stipend, housing, health insurance, flights and a Turkish language year.",
    aboutAr: "تشمل الرسوم وراتبًا شهريًا والسكن والتأمين الصحي والطيران وسنة لغة تركية.",
  },
  {
    url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    en: "Erasmus Mundus Joint Masters (EU)", ar: "ماجستير إيراسموس موندوس المشترك (الاتحاد الأوروبي)",
    levels: ["master"], palestinian: "open",
    windowEn: "Each programme sets its own deadline, usually between October and January.",
    windowAr: "لكل برنامج موعده، وغالبًا بين أكتوبر ويناير.",
    aboutEn: "Fully funded joint master's degrees taught in two or more European countries.",
    aboutAr: "برامج ماجستير مشتركة ممولة بالكامل تُدرَّس في دولتين أوروبيتين أو أكثر.",
  },
  {
    url: "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/",
    en: "DAAD Scholarships (Germany)", ar: "منح DAAD (ألمانيا)",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "Deadlines vary by programme, often August to October. Search the database by country of origin.",
    windowAr: "المواعيد حسب البرنامج، وغالبًا بين أغسطس وأكتوبر. ابحث في قاعدة البيانات حسب بلدك.",
    aboutEn: "The German Academic Exchange Service's funding for master's, PhD and research stays in Germany.",
    aboutAr: "تمويل الهيئة الألمانية للتبادل الأكاديمي للماجستير والدكتوراه والإقامات البحثية في ألمانيا.",
  },
  {
    url: "https://www.gatescambridge.org/",
    en: "Gates Cambridge Scholarship (UK)", ar: "منحة غيتس كامبريدج (المملكة المتحدة)",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "Applied for with the Cambridge application. Deadlines are in October for US applicants and December to January for everyone else.",
    windowAr: "يُقدَّم مع طلب القبول في كامبريدج. الموعد في أكتوبر للأمريكيين، وبين ديسمبر ويناير لغيرهم.",
    aboutEn: "Full-cost postgraduate scholarship at the University of Cambridge for applicants from any country outside the UK.",
    aboutAr: "منحة كاملة للدراسات العليا في جامعة كامبريدج لمتقدمين من أي دولة خارج بريطانيا.",
  },
  {
    url: "https://www.ox.ac.uk/clarendon",
    en: "Clarendon Fund Scholarships (Oxford)", ar: "منح صندوق كلارندون (أكسفورد)",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "Apply for your Oxford course by its November to January deadline and you are considered automatically.",
    windowAr: "يُنظر في الطلب تلقائيًا عند التقديم للبرنامج في أكسفورد قبل موعده بين نوفمبر ويناير.",
    aboutEn: "Fully funded graduate scholarships at Oxford, awarded on academic merit to students of any nationality.",
    aboutAr: "منح دراسات عليا ممولة بالكامل في أكسفورد على أساس التفوق، لجميع الجنسيات.",
  },
  {
    url: "https://knight-hennessy.stanford.edu/",
    en: "Knight-Hennessy Scholars (Stanford, USA)", ar: "منحة نايت-هينيسي (ستانفورد، الولايات المتحدة)",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "Opens in summer and closes in early October.",
    windowAr: "يفتح صيفًا ويغلق مطلع أكتوبر.",
    aboutEn: "Up to three years of fully funded graduate study at Stanford, open to every nationality.",
    aboutAr: "تمويل كامل للدراسات العليا في ستانفورد حتى ثلاث سنوات، لجميع الجنسيات.",
  },
  {
    url: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    en: "Eiffel Excellence Scholarship (France)", ar: "منحة إيفل للتميز (فرنسا)",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "French universities nominate candidates. The call opens in October and closes in January.",
    windowAr: "تُرشّح الجامعات الفرنسية المتقدمين. يفتح في أكتوبر ويغلق في يناير.",
    aboutEn: "French government scholarship for international master's and PhD students.",
    aboutAr: "منحة الحكومة الفرنسية لطلاب الماجستير والدكتوراه الدوليين.",
  },
  {
    url: "https://www.kaust.edu.sa/",
    en: "KAUST Fellowship (Saudi Arabia)", ar: "زمالة جامعة الملك عبدالله (كاوست) – السعودية",
    levels: ["master", "phd"], palestinian: "open",
    windowEn: "Admission rounds run from about December to February.",
    windowAr: "جولات القبول تقريبًا من ديسمبر إلى فبراير.",
    aboutEn: "All admitted master's and PhD students receive full tuition, a monthly stipend, housing and medical cover.",
    aboutAr: "يحصل جميع المقبولين في الماجستير والدكتوراه على رسوم كاملة وراتب شهري وسكن وتأمين طبي.",
  },
  {
    url: "https://www.studyinnl.org/finances/holland-scholarship",
    en: "Holland Scholarship (Netherlands)", ar: "منحة هولندا (Holland Scholarship)",
    levels: ["bachelor", "master"], palestinian: "open", funding: "partial",
    windowEn: "Deadlines are usually 1 February or 1 May, depending on the university.",
    windowAr: "المواعيد عادةً 1 فبراير أو 1 مايو حسب الجامعة.",
    aboutEn: "€5,000 for the first year, for students from outside the EEA.",
    aboutAr: "5000 يورو للسنة الأولى للطلاب من خارج المنطقة الاقتصادية الأوروبية.",
  },
  // ---- Eligible countries vary by year
  {
    url: "https://stipendiumhungaricum.hu/",
    en: "Stipendium Hungaricum (Hungary)", ar: "منحة ستيبنديوم هنغاريكوم (المجر)",
    levels: ["bachelor", "master", "phd"], palestinian: "unknown",
    windowEn: "Usually open from November to mid-January. Check the list of partner countries.",
    windowAr: "يفتح عادةً من نوفمبر حتى منتصف يناير. راجع قائمة الدول الشريكة.",
    aboutEn: "Hungarian government scholarship covering tuition, a monthly stipend, housing and health insurance.",
    aboutAr: "منحة الحكومة المجرية تشمل الرسوم وراتبًا شهريًا والسكن والتأمين الصحي.",
  },
  {
    url: "https://www.campuschina.org/",
    en: "Chinese Government Scholarship (CSC)", ar: "منحة الحكومة الصينية (CSC)",
    levels: ["bachelor", "master", "phd"], palestinian: "unknown",
    windowEn: "Usually January to April, through the embassy or the university.",
    windowAr: "عادةً من يناير إلى أبريل عبر السفارة أو الجامعة.",
    aboutEn: "Fully funded study at more than 280 Chinese universities.",
    aboutAr: "دراسة ممولة بالكامل في أكثر من 280 جامعة صينية.",
  },
  {
    url: "https://www.studyinkorea.go.kr/",
    en: "Global Korea Scholarship (GKS)", ar: "منحة كوريا العالمية (GKS)",
    levels: ["bachelor", "master", "phd"], palestinian: "unknown",
    windowEn: "Graduate track usually February to March; undergraduate track September to October.",
    windowAr: "الدراسات العليا عادةً فبراير–مارس، والبكالوريوس سبتمبر–أكتوبر.",
    aboutEn: "Covers tuition, flights, a monthly allowance and a year of Korean language. Eligible countries change every year.",
    aboutAr: "تشمل الرسوم والطيران وراتبًا شهريًا وسنة لغة كورية. الدول المؤهلة تتغير سنويًا.",
  },
  {
    url: "https://www.studyinjapan.go.jp/en/",
    en: "MEXT Japanese Government Scholarship", ar: "منحة الحكومة اليابانية (MEXT)",
    levels: ["bachelor", "master", "phd"], palestinian: "unknown",
    windowEn: "Embassy-recommendation track usually opens around April to June.",
    windowAr: "مسار ترشيح السفارة يفتح عادةً بين أبريل ويونيو.",
    aboutEn: "Fully funded undergraduate, master's and PhD study in Japan.",
    aboutAr: "دراسة ممولة بالكامل للبكالوريوس والماجستير والدكتوراه في اليابان.",
  },
  {
    url: "https://si.se/en/apply/scholarships/",
    en: "Swedish Institute Scholarships for Global Professionals", ar: "منح المعهد السويدي للمهنيين العالميين",
    levels: ["master"], palestinian: "unknown",
    windowEn: "Usually open in February, after you apply to a Swedish master's programme.",
    windowAr: "يفتح عادةً في فبراير بعد التقديم على ماجستير في السويد.",
    aboutEn: "Covers tuition, living costs and travel. Eligible countries are listed each year.",
    aboutAr: "تغطي الرسوم والمعيشة والسفر، وتُحدَّد الدول المؤهلة كل عام.",
  },
  {
    url: "https://www.sbfi.admin.ch/scholarships_eng",
    en: "Swiss Government Excellence Scholarships", ar: "منح التميز من الحكومة السويسرية",
    levels: ["phd"], palestinian: "unknown",
    windowEn: "Deadlines vary by country, usually between August and December.",
    windowAr: "المواعيد حسب الدولة، عادةً بين أغسطس وديسمبر.",
    aboutEn: "For PhD and postdoctoral research at Swiss universities.",
    aboutAr: "للدكتوراه والبحث ما بعد الدكتوراه في الجامعات السويسرية.",
  },
];

export const officialSource: Source = {
  id: ANNUAL_SOURCE_ID,
  name: "Annual programmes",
  homepage: "https://www.chevening.org/",
  region: "official",
  async fetch() {
    return PROGRAMMES.map(
      (p): RawItem => ({
        url: p.url,
        title: p.en,
        titleAr: p.ar,
        text: "",
        excerpt: `${p.aboutEn} ${p.windowEn}`,
        summaryAr: `${p.aboutAr} ${p.windowAr}`,
        kind: "scholarship",
        levels: p.levels,
        funding: p.funding ?? "full",
        palestinian: p.palestinian,
        deadline: null,
      }),
    );
  },
};
