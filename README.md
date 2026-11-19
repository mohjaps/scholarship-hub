# Scholarship Hub · بوابة المنح

A Next.js (TypeScript) website that collects **bachelor's, master's and PhD scholarships** and **travel opportunities** (fellowships, exchanges, summer schools, conferences and training) from Arabic, global and official sources. It shows them in **Arabic (RTL) and English**, and lets you filter for opportunities **open to Palestinians**.

موقع Next.js يجمع منح البكالوريوس والماجستير والدكتوراه وفرص السفر من مواقع عربية وعالمية ورسمية، بواجهة عربية وإنجليزية، مع تصفية للفرص المتاحة للفلسطينيين.

## Features

- **10 sources**:
  | Group | Source | Method |
  | --- | --- | --- |
  | Palestinian | wenak.ps (scholarships listed for Palestinian students) | HTML (cheerio) |
  | Arabic | Persmind, StudyShoot | WordPress REST API |
  | Global | Scholars4Dev, Opportunity Desk, Opportunities Corners, Greatyop, Scholarships Corner, Scholarship Region, Fully Scholarships, Montessori Line, Youth Opportunities | WordPress REST API (latest 100 posts each) |
  | Official | Erasmus Mundus catalogue (EACEA) | HTML (cheerio) |
  | Annual | 22 major programmes that open every year, with their usual window (`src/lib/scrapers/official.ts`) | Curated list |
- **Built for Palestinian students**: calls limited to other nationalities or regions ("…for Nigerian students", "Africa … Fellowship", "منح للسوريين", Commonwealth-only) are dropped. Among items without a deadline, Palestine-specific ones are listed first.
- **Annual scholarships tab** (`?annual=1`): Chevening, Fulbright, Rhodes (Syria/Jordan/Lebanon/Palestine), IsDB, Said Foundation, Taawon, Türkiye Bursları, DAAD, Erasmus Mundus, Gates Cambridge, Clarendon, Knight-Hennessy, Eiffel, KAUST, Stipendium Hungaricum, CSC, GKS, MEXT and others.
- **Sync** every 12 hours (two Vercel cron jobs), plus a **Sync now** button with a 30-minute cooldown.
- **Automatic classification** of each post (`src/lib/classify.ts`), working in English, Arabic and French:
  - degree level: bachelor / master / PhD;
  - type: scholarship, fellowship, exchange, conference, training;
  - funding: fully funded or partially funded;
  - deadline: parsed from "Deadline: 15 January 2027", "آخر موعد للتقديم: ١٥ يناير ٢٠٢٧", "Date limite : 3 mars 2027", and similar;
  - Palestinian eligibility: `explicit` (Palestine, Gaza or the West Bank is named), `open` (all nationalities, international or developing-country students), or `unknown`.
- **Skips non-opportunities**: guides, roundups ("10 scholarships…"), and visa or motivation-letter articles.
- **Sorting**: upcoming deadlines first, soonest at the top. Expired items are hidden unless "Show expired" is ticked.
- **Bilingual UI** at `/ar` and `/en`. Visiting `/` redirects according to `Accept-Language`.
- **JSON API**: `GET /api/opportunities?q=&level=bachelor|master|phd&kind=&palestinian=eligible|explicit&lang=ar|en|fr&source=&expired=1&page=`.

## Deploy to Vercel

1. Push this repo to GitHub, then go to **vercel.com → Add New → Project** and import it. The framework is detected as Next.js.
2. Deploy. **The site works with no database**: the first visitor triggers a scrape (about 15 seconds), and the result is cached in Vercel's data cache for 6 hours. This mode keeps only the latest scrape.
3. **Optional: add Supabase** to store history.
   - **Option A, the Vercel integration:** in the Vercel project, open **Storage → Create → Supabase** (or go to **Integrations → Supabase**) and connect it to the project with Production ticked. It sets `POSTGRES_URL` for you.
   - **Option B, manually:** in Supabase, open **Connect → Connection string → Transaction pooler**, port `6543`. It looks like
     `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`.
     Add it in Vercel under **Settings → Environment Variables** as `DATABASE_URL`.

   Then **redeploy**, because variables only apply to new deployments. Tables are created automatically.
   Any Postgres works, including Neon and Supabase. The app reads `DATABASE_URL`, `POSTGRES_URL`, or a prefixed `<PREFIX>_POSTGRES_URL`.
4. **Add `CRON_SECRET`.** In **Settings → Environment Variables**, set it to a long random string, for example the output of `openssl rand -hex 32`. Vercel Cron sends it automatically, and without it the cron endpoint refuses every request in production.
5. To fill the database straight away instead of waiting for the daily cron:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.vercel.app/api/cron/scrape
   ```
6. Check the setup at `/api/health`. It reports the storage mode, the item count and the last run, and shows variable names only, never values.

The Hobby plan runs cron jobs once a day, which is what `vercel.json` uses. A full scrape normally takes 10–60 seconds, and the route allows up to 300 seconds.

## Run locally

```bash
npm install
npm run scrape   # fills .data/opportunities.json (or Postgres if DATABASE_URL is set)
npm run dev      # http://localhost:3000
```

Other commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

> Behind an HTTP proxy, Node's built-in `fetch` ignores `HTTPS_PROXY`. Run the scraper with `NODE_USE_ENV_PROXY=1 npm run scrape` (Node ≥ 22.21).

## Adding a source

- **WordPress site**: add a `wordpressSource({...})` entry in `src/lib/scrapers/index.ts`. To get the category ids, open `https://SITE/wp-json/wp/v2/categories?per_page=100`.
- **Other site**: implement the `Source` interface (`fetch(): Promise<RawItem[]>`). See `src/lib/scrapers/erasmus.ts`.
- **Programme you want to list manually**: add it to `src/lib/scrapers/official.ts`.

Sites behind a Cloudflare bot challenge, such as for9a.com and al-fanarmedia.org, can't be read with plain HTTP and are not included.

## Project layout

```
src/
  app/[locale]/        bilingual pages (ar, en)
  app/api/             /api/opportunities and /api/cron/scrape
  components/          card + filter form
  i18n/dictionaries.ts Arabic / English strings
  lib/classify.ts      level / type / deadline / eligibility detection
  lib/scrapers/        sources + normalization
  lib/store/           Postgres (Supabase/Neon), Vercel data-cache and local JSON stores
  proxy.ts             / → /ar or /en
tests/                 vitest unit tests
```

## Disclaimer

The data is collected automatically and can be wrong, especially deadlines and eligibility. Check the official page before applying. Each card links to its source.
