"use client";

/**
 * نطاق الخريطة — كاسر الإيقاع في الصفحة.
 *
 * ⚠️ المشكلة التي يحلّها ليست الخريطة وحدها: الصفحة كانت **ستّة نطاقات أفقية
 * متطابقة البنية** (عنوان + زرّ + شبكة) على خلفية واحدة فاتحة — لا تباين، ولا
 * لحظة تتوقّف عندها العين. نطاقٌ داكن ممتدّ من حافة إلى حافة يقسم الصفحة نصفين
 * ويمنحها إيقاعاً؛ وهو نمطٌ قياسيّ في المنصّات العالمية لأنه يفصل «التصفّح» عن
 * «الاستكشاف الجغرافي».
 *
 * الخريطة عرضٌ فقط: البطاقة كلّها رابط، فلا يبتلع سحبُها تمريرَ الصفحة على
 * الجوّال. والتحميل مؤجَّل إلى دخولها مجال الرؤية — Leaflet ثقيل ولا يجوز أن
 * يدخل حزمة الرئيسية.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { AltArrowLeft, MapPoint, Ruler, Buildings2 } from "@solar-icons/react";

const StaticPinsMap = dynamic(() => import("./StaticPinsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-primary-900/40 animate-pulse" />,
});

interface Pin {
  id: number;
  latitude: string | number | null;
  longitude: string | number | null;
}

export function MapBand({
  cityId,
  countryCode,
  where,
}: {
  cityId?: string;
  countryCode?: string;
  where: string;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [pins, setPins] = useState<Pin[] | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (e) => e.some((x) => x.isIntersecting) && (setVisible(true), io.disconnect()),
      { rootMargin: "250px" },
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

  const href = cityId
    ? `/properties?view=map&city=${cityId}`
    : "/properties?view=map";

  return (
    <section ref={holder} className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* النصّ — الثلث */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-caption font-bold text-white/80">
            <MapPoint weight="Bold" className="h-4 w-4" />
            استكشاف جغرافي
          </span>
          <h2 className="text-h1 mt-4 text-balance">
            شوف العقار على الخريطة قبل ما تروح
          </h2>
          <p className="text-body-lg text-white/70 mt-3 leading-relaxed">
            كل عقار بموقعه الدقيق في {where} — قرّب على الحيّ الذي تريده، وشاهد
            ما حوله من طرق وخدمات، ثم تواصل مع المالك مباشرةً.
          </p>

          <dl className="flex flex-wrap gap-x-8 gap-y-4 mt-7">
            <div>
              <dt className="text-caption text-white/55">عقارات بموقع محدّد</dt>
              <dd className="text-h2 tabular-nums mt-0.5">
                {points.length.toLocaleString(NUMERIC_LOCALE)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-white/55">تصفّح</dt>
              <dd className="text-h2 mt-0.5">بالحيّ لا بالقائمة</dd>
            </div>
          </dl>

          <Link
            href={href}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-body font-bold text-ink mt-7 hover:bg-white/90 transition-colors"
          >
            افتح الخريطة
            <AltArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* الخريطة — الثلثان */}
        <Link
          href={href}
          className="lg:col-span-7 block rounded-3xl overflow-hidden ring-1 ring-white/15 shadow-e5 relative h-64 sm:h-80 lg:h-[420px] bg-primary-900/40"
          aria-label="افتح الخريطة الكاملة"
        >
          {visible && points.length > 0 ? (
            <>
              <StaticPinsMap points={points} />
              {/* حجابٌ رقيق: يربط الخريطة بالنطاق الداكن بلا أن يطمسها. */}
              <div className="absolute inset-0 bg-ink/10 pointer-events-none" />
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-white/40">
              <Buildings2 weight="Linear" className="h-10 w-10" />
              <span className="text-caption">
                {pins === null ? "" : `لا عقار بموقع محدّد في ${where} بعد`}
              </span>
            </div>
          )}
          <span className="absolute bottom-4 start-4 inline-flex items-center gap-1.5 rounded-lg bg-ink/75 backdrop-blur-sm px-3 py-1.5 text-caption font-semibold text-white pointer-events-none">
            <Ruler className="h-4 w-4" />
            اضغط للتكبير والتصفّح
          </span>
        </Link>
      </div>
    </section>
  );
}
