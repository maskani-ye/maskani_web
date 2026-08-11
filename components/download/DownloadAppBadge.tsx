import { APK_URL, APK_VERSION } from "@/lib/appDownload";

// شعار أندرويد (روبوت) — SVG مضمّن، بلا اعتماد خارجي.
function AndroidGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 00-.83.22l-1.88 3.24a11.43 11.43 0 00-8.94 0L5.65 5.67a.643.643 0 00-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 001 18h22a10.78 10.78 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  );
}

// شعار تحميل التطبيق (تنزيل APK مباشر) — يُوضع في الهوم وأي مكان آخر.
// variant: "light" على خلفية داكنة (الهيرو)، "dark" على خلفية فاتحة.
export function DownloadAppBadge({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const base =
    variant === "light"
      ? "bg-white text-ink hover:bg-white/90"
      : "bg-ink text-white hover:bg-ink-light";
  return (
    <a
      href={APK_URL}
      className={`group inline-flex items-center gap-3 rounded-2xl px-5 py-3 shadow-lg transition-colors ${base} ${className}`}
      aria-label={`تحميل تطبيق مسكني للأندرويد (النسخة ${APK_VERSION})`}
    >
      <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary/10">
        <AndroidGlyph className="h-6 w-6 text-primary" />
      </span>
      <span className="flex flex-col text-right leading-tight">
        <span className="text-[11px] opacity-70">تحميل مباشر · أندرويد · مجاناً</span>
        <span className="text-base font-extrabold -mt-0.5">حمّل تطبيق مسكني</span>
      </span>
    </a>
  );
}
