// خادمي — كتلة تعريفية فريدة (h1 + فقرة غنيّة بالكلمات المفتاحية) تُصيَّر في HTML
// الخام أعلى قوائم الأقسام. تعالج «المحتوى الضعيف» وترفع ملاءمة الصفحة للبحث.
export default function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <h1 className="text-h2 sm:text-h1 font-extrabold text-ink leading-tight">{title}</h1>
      <p className="text-muted-600 mt-2 leading-relaxed max-w-3xl text-body sm:text-body-lg">
        {children}
      </p>
    </section>
  );
}
