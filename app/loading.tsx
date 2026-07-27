// حالة تحميل عامة لكل صفحات المستخدم — دوّار زيتوني بسيط ومتّسق
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}
