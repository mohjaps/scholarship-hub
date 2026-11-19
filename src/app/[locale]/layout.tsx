import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { dictionaries, dir, isLocale, LOCALES } from "@/i18n/dictionaries";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dictionaries[locale];
  return {
    title: t.siteName,
    description: t.tagline,
    alternates: { languages: { ar: "/ar", en: "/en" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#14161a" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={dir(locale)}>
      <body>{children}</body>
    </html>
  );
}
