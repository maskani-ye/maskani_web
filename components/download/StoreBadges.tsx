import { APK_URL, APPGALLERY_URL } from "@/lib/appDownload";

// شعار Google Play (المثلّث رباعيّ الألوان) — SVG مضمّن.
function GooglePlayLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#00C3FF" d="M3.7 2.3c-.25.26-.4.66-.4 1.18v17.04c0 .52.15.92.4 1.18l.06.06 9.55-9.55v-.42L3.76 2.24l-.06.06z" />
      <path fill="#FFCE00" d="M16.5 15.02l-3.19-3.19v-.42l3.19-3.19.07.04 3.78 2.15c1.08.61 1.08 1.62 0 2.24l-3.78 2.15-.07.02z" />
      <path fill="#FF3D00" d="M16.57 14.98L13.31 11.72 3.7 21.34c.36.38.95.42 1.61.05l11.26-6.41" />
      <path fill="#00E676" d="M16.57 8.66L5.31 2.26C4.65 1.88 4.06 1.93 3.7 2.31l9.61 9.41 3.26-3.06z" />
    </svg>
  );
}

// شعار App Store (تفّاحة Apple) — SVG مضمّن.
function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// شعار Huawei AppGallery — بتلة مبسّطة.
function AppGalleryLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.2c1.6 0 2.9 1.3 2.9 2.9 0 1.2-.7 2.2-1.7 2.6.3 1.6 1.6 2.8 3.2 3-.4 1-1.4 1.8-2.5 1.8-1.6 0-2.9-1.3-2.9-2.9 0-.2 0-.4.1-.6-.2 0-.4.1-.6.1-1.6 0-2.9-1.3-2.9-2.9 0-1.1.6-2 1.5-2.5.4-1 1.3-1.7 2.4-1.9.2 0 .3 0 .5-.1 0 .1.3.9.5 1.9z" />
    </svg>
  );
}

function Badge({
  href,
  logo,
  small,
  name,
  disabled,
}: {
  href?: string;
  logo: React.ReactNode;
  small: string;
  name: string;
  disabled?: boolean;
}) {
  const inner = (
    <span
      className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-colors ${
        disabled
          ? "bg-white/5 border-white/10 opacity-55"
          : "bg-black border-black hover:bg-black/80"
      }`}
    >
      <span className="shrink-0 h-6 w-6 grid place-items-center text-white">{logo}</span>
      <span className="flex flex-col leading-tight text-left" dir="ltr">
        <span className="text-[10px] text-white/70">{small}</span>
        <span className="text-sm font-bold text-white -mt-0.5">{name}</span>
      </span>
      {disabled && (
        <span className="absolute -top-1.5 -left-1.5 text-[9px] font-bold bg-gold text-ink rounded-full px-1.5 py-0.5">
          قريباً
        </span>
      )}
    </span>
  );

  if (disabled || !href) {
    return (
      <div aria-disabled className="cursor-not-allowed select-none">
        {inner}
      </div>
    );
  }
  return (
    <a href={href} aria-label={`تحميل تطبيق مسكني — ${name}`}>
      {inner}
    </a>
  );
}

// أزرار المتاجر في الفوتر — التنزيل المباشر و AppGallery فعّالان، وApp Store
// معطّل حتى رفع نسخته.
export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-2.5">
      <Badge href={APK_URL} logo={<GooglePlayLogo className="h-6 w-6" />} small="تحميل مباشر" name="Google Play" />
      <Badge disabled logo={<AppleLogo className="h-6 w-6" />} small="قريباً على" name="App Store" />
      <Badge href={APPGALLERY_URL} logo={<AppGalleryLogo className="h-6 w-6" />} small="متوفّر على" name="AppGallery" />
    </div>
  );
}
