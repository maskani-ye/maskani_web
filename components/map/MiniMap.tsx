"use client";
// ─────────────────────────────────────────────────────────────────────────
//  الواجهة العامة للخريطة المصغّرة (تفاصيل الإعلان) — غلاف next/dynamic
//  ssr:false. Leaflet client-only فقط.
//
//  ⚠️  نقطة تبديل مزوّد الخرائط محصورة في components/map/ — نفس الـ props.
// ─────────────────────────────────────────────────────────────────────────
import dynamic from "next/dynamic";
import type { MiniMapLeafletProps } from "./MiniMapLeaflet";

const MiniMapLeaflet = dynamic(() => import("./MiniMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-50 text-sm text-primary">
      جاري تحميل الخريطة…
    </div>
  ),
});

export type MiniMapProps = MiniMapLeafletProps;

export default function MiniMap(props: MiniMapProps) {
  return <MiniMapLeaflet {...props} />;
}
