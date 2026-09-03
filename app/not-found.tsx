import Link from "next/link";

// صفحة 404 عامة على مستوى التطبيق
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-cream" dir="rtl">
      <p className="text-display font-extrabold text-primary mb-2">404</p>
      <h1 className="text-h3 font-bold text-ink mb-1">الصفحة غير موجودة</h1>
      <p className="text-body text-muted-500 mb-6 max-w-sm">
        عذراً، الصفحة التي تبحث عنها غير متوفّرة أو تم نقلها.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary text-white text-body font-semibold hover:bg-primary-600 transition-colors"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
