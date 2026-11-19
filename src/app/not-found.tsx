import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <p>الصفحة غير موجودة · Page not found</p>
        <p>
          <Link href="/ar">العربية</Link> · <Link href="/en">English</Link>
        </p>
      </body>
    </html>
  );
}
