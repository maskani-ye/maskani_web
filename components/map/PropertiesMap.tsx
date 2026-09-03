"use client";
// ─────────────────────────────────────────────────────────────────────────
//  الواجهة العامة لخريطة تصفّح العقارات — غلاف next/dynamic ssr:false.
//  Leaflet يحتاج window، لذا يُحمَّل client-only فقط (وإلا انهار SSR بـ
//  "window is not defined").
//
//  ⚠️  هذا الملف والملفات المجاورة في components/map/ هي نقطة التبديل الوحيدة
//      لأي مزوّد خرائط بديل (Google Maps JS) — نفس الـ props.
// ─────────────────────────────────────────────────────────────────────────
import dynamic from "next/dynamic";
import type { PropertiesLeafletMapProps } from "./PropertiesLeafletMap";

const PropertiesLeafletMap = dynamic(() => import("./PropertiesLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-50 text-body text-primary">
      جاري تحميل الخريطة…
    </div>
  ),
});

export type PropertiesMapProps = PropertiesLeafletMapProps;

export default function PropertiesMap(props: PropertiesMapProps) {
  return <PropertiesLeafletMap {...props} />;
}
