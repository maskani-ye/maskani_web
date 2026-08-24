"use client";

/**
 * معاينة الخريطة في الرئيسية — دبابيس حقيقية لعقارات السوق المختار.
 *
 * ⚠️ كان مكانها **مستطيل تدرّج بنفسجيّ** مكتوب عليه «تصفّح العقارات على
 * الخريطة». في العقار، الخريطة أقوى إغراء بصريّ موجود: معاينة حيّة بدبابيس
 * تجذب النقر أضعاف ما يجذبه بانر نصّي — والمنصّة تملك `/properties/map/`
 * جاهزاً (مقيَّداً بـ500 نقطة) ولا تعرض منه شيئاً.
 *
 * الخريطة **غير تفاعلية عمداً**: البطاقة كلّها رابط إلى الخريطة الكاملة، فلا
 * يتنافس السحب داخلها مع تمرير الصفحة على الجوّال — وهو أسوأ ما يفعله تضمين
 * خريطة تفاعلية وسط صفحة.
 *
 * التحميل مؤجَّل إلى دخولها مجال الرؤية: Leaflet ثقيل، وحقنه في حزمة الرئيسية
 * يضرب LCP الذي عولج سابقاً بجهد.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AltArrowLeft, MapPoint } from "@solar-icons/react";

const StaticPinsMap = dynamic(() => import("./StaticPinsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-primary-50 animate-pulse" />,
});

interface Pin {
  id: number;
  latitude: string | number | null;
  longitude: string | number | null;
}

export function HomeMapPreview({
  cityId,
  countryCode,
}: {
  cityId?: string;
  countryCode?: string;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [pins, setPins] = useState<Pin[] | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const params: Record<string, string> = {};
    if (cityId) params.city = cityId;
    else if (countryCode) params.country = countryCode;
    api
      .get<{ results?: Pin[] }>("/properties/map/", { params })
      .then((r) => setPins(r.data.results ?? []))
      .catch(() => setPins([]));
  }, [visible, cityId, countryCode]);

  const points = (pins ?? [])
    .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

  return (
    <Link
      href={cityId ? `/properties?view=map&city=${cityId}` : "/properties?view=map"}
      className="group block rounded-3xl overflow-hidden ring-1 ring-ink/[0.06] shadow-e2 hover:shadow-e3 transition-shadow"
      ref={holder as never}
    >
      <div className="relative h-56 sm:h-72 bg-primary-50">
        {visible && points.length > 0 ? (
          <StaticPinsMap points={points} />
        ) : (
          <div className="h-full w-full bg-primary-50" />
        )}

        {/* حجابٌ فوق الخريطة: يمنع أي تفاعل معها ويُبقي البطاقة رابطاً واحداً. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-center gap-4 text-white">
          <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <MapPoint weight="Bold" className="h-6 w-6" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-h3">تصفّح العقارات على الخريطة</span>
            <span className="block text-caption text-white/75 mt-0.5">
              {points.length > 0
                ? `${points.length.toLocaleString("ar")} عقاراً بموقعه الدقيق`
                : "اكتشف العقارات حسب موقعها الجغرافي"}
            </span>
          </span>
          <AltArrowLeft className="h-5 w-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
