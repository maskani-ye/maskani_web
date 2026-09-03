"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { DangerTriangle, Refresh } from "@solar-icons/react";

// حدّ خطأ على مستوى المسار — يظهر عند فشل تحميل أي صفحة /admin مع زر إعادة المحاولة
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center" dir="rtl">
      <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
        <DangerTriangle className="h-7 w-7 text-danger-600" />
      </div>
      <h2 className="text-h3 font-bold text-ink mb-1">حدث خطأ غير متوقّع</h2>
      <p className="text-body text-muted-500 mb-6 max-w-sm">
        تعذّر تحميل هذه الصفحة. يمكنك إعادة المحاولة، وإن استمرّت المشكلة تواصل مع فريق الدعم.
      </p>
      <Button variant="primary" onClick={() => reset()}>
        <Refresh className="h-4 w-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}
