"use client";

import { usePathname } from "next/navigation";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const ar = !usePathname()?.startsWith("/en");
  return (
    <main className="wrap" style={{ paddingBlock: 48 }}>
      <div className="empty">
        <p>
          {ar
            ? "تعذّر تحميل الفرص الآن. إن كان الموقع جديدًا فتأكد من ربط قاعدة بيانات Neon بالمشروع على Vercel."
            : "Couldn't load opportunities right now. On a new deployment, make sure a Neon database is connected to the Vercel project."}
        </p>
        <p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a page */}
          <a href="/api/health">/api/health</a>
        </p>
        <button type="button" onClick={reset}>
          {ar ? "إعادة المحاولة" : "Try again"}
        </button>
      </div>
    </main>
  );
}
