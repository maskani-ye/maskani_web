/**
 * قالب الصفحات القانونية — **تنسيق واحد للشروط والخصوصية وما يأتي بعدهما**.
 *
 * ⚠️ **كان النصّ والتنسيق منسوخين حرفياً في ملفّين**: نفس `<style>` ونفس
 * الحاوية ونفس المسافات. أي تعديل في مقاس العنوان أو لون الرابط كان يحتاج
 * تعديلين، وينسى أحدهما فتختلف صفحتان قانونيّتان في المظهر — وهو ما يقرؤه
 * الزائر «موقعٌ غير مضبوط» في أكثر الصفحات حساسية للثقة.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  /** تاريخ آخر تحديث — الصفحة القانونية بلا تاريخ لا يُوثق بها. */
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <main dir="rtl" className="min-h-screen bg-cream px-5 py-12">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-e2 sm:p-10">
        <h1 className="text-h1 text-ink">{title}</h1>
        {updatedAt && <p className="mt-2 text-caption text-muted">آخر تحديث: {updatedAt}</p>}
        <div className="legal-body mt-6 text-body leading-relaxed text-ink/80">{children}</div>
      </article>
    </main>
  );
}

export default LegalPage;
