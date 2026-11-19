import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "./i18n/dictionaries";

/** Redirect "/" (and other locale-less paths) to /ar or /en from Accept-Language. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  const accept = request.headers.get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((l) => (LOCALES as readonly string[]).includes(l));
  const locale = preferred ?? DEFAULT_LOCALE;
  return NextResponse.redirect(new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url));
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
