"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة مصغّرة غير تفاعلية بعلامة واحدة (لصفحة تفاصيل العقار).
//
//  ⚠️  للتبديل إلى Google Maps JS مستقبلاً: أعد كتابة هذا الملف فقط بنفس الـ
//      props. لا شيء من Leaflet يتسرّب خارج مجلد components/map/.
// ─────────────────────────────────────────────────────────────────────────
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { propertyIcon } from "./leafletSetup";

import "leaflet/dist/leaflet.css";

export interface MiniMapLeafletProps {
  lat: number;
  lng: number;
  zoom?: number;
}

// ⚠️ **بلاط OpenStreetMap لا CARTO.** كان CARTO Voyager، وصار يطبع **«API KEY
// REQUIRED»** قُطرياً على كل بلاطة (مُتحقَّق بتنزيل بلاطة 2026‑08‑30) — خريطةٌ
// مشوّهة على أهمّ شاشة عندنا، والبديل المرخّص عندهم مدفوع. وبلاط OSM يكسب
// شيئاً إضافياً: أسماؤه **بالعربية** في منطقتنا (بورتسودان · البحر الأحمر)
// بينما CARTO يكتبها بالإنجليزية — فالتصحيح إصلاحٌ ومكسب لغويّ معاً.
// شرطه: ذِكر النسب (تحته) وترويسة وكيلٍ صحيحة (يُرسلها المتصفّح).
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "© مساهمو OpenStreetMap";

export default function MiniMapLeaflet({ lat, lng, zoom = 15 }: MiniMapLeafletProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl
      className="maskani-map h-full w-full rounded-2xl z-0"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <Marker position={[lat, lng]} icon={propertyIcon} />
    </MapContainer>
  );
}
