"use client";

/**
 * لوحة الفلاتر — الصفّ المنسدل تحت شريط التصفّح.
 *
 * ⚠️ **كانت منسوخة في الخدمات وطلبات الخدمات** بنفس الحدّ ونفس الحشو ونفس
 * توزيع الأعمدة. الفارق بينهما حقولها فقط، وهي ما يُمرَّر هنا. أي تغيير في
 * مظهر اللوحة (حدّها أو مسافاتها) يقع الآن مرّة واحدة.
 */
export function FilterPanel({
  cols = 2,
  children,
}: {
  /** عدد أعمدة الحقول على الشاشة المتوسّطة فأكبر. */
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const grid =
    cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4"
    : cols === 3 ? "sm:grid-cols-3"
    : "sm:grid-cols-2";
  return (
    <div className={`grid gap-3 border-t border-ink/[0.07] p-3 sm:p-5 ${grid}`}>
      {children}
    </div>
  );
}

export default FilterPanel;
