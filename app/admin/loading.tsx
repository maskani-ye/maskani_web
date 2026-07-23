import { Skeleton } from "@/components/ui/Skeleton";

// حالة تحميل على مستوى المسار لكل صفحات /admin — هيكل عظمي بسيط ومتّسق
export default function AdminLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">
      {/* عنوان */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* جدول / محتوى */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
