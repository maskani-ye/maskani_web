"use client";
// ─────────────────────────────────────────────────────────────────────────
//  الواجهة العامة لخريطة تصفّح الإعلانات — غلاف next/dynamic ssr:false.
//  Leaflet يحتاج window، لذا يُحمَّل client-only فقط (وإلا انهار SSR بـ
//  "window is not defined").
//
//  ⚠️  هذا الملف والملفات المجاورة في components/map/ هي نقطة التبديل الوحيدة
//      لأي مزوّد خرائط بديل (Google Maps JS) — نفس الـ props.
// ─────────────────────────────────────────────────────────────────────────
import dynamic from "next/dynamic";
import type { ListingsLeafletMapProps } from "./ListingsLeafletMap";

const ListingsLeafletMap = dynamic(() => import("./ListingsLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-50 text-sm text-primary">
      جاري تحميل الخريطة…
    </div>
  ),
});

export type ListingsMapProps = ListingsLeafletMapProps;

export default function ListingsMap(props: ListingsMapProps) {
  return <ListingsLeafletMap {...props} />;
}
