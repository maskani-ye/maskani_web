"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة تفاعلية لاختيار موقع العقار — اضغط على الخريطة لوضع العلامة.
//  كل تبعية Leaflet محبوسة داخل components/map/ فقط.
// ─────────────────────────────────────────────────────────────────────────
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { propertyIcon } from "./leafletSetup";

import "leaflet/dist/leaflet.css";

// ⚠️ **بلاط OpenStreetMap لا CARTO.** كان CARTO Voyager، وصار يطبع **«API KEY
// REQUIRED»** قُطرياً على كل بلاطة (مُتحقَّق بتنزيل بلاطة 2026‑08‑30) — خريطةٌ
// مشوّهة على أهمّ شاشة عندنا، والبديل المرخّص عندهم مدفوع. وبلاط OSM يكسب
// شيئاً إضافياً: أسماؤه **بالعربية** في منطقتنا (بورتسودان · البحر الأحمر)
// بينما CARTO يكتبها بالإنجليزية — فالتصحيح إصلاحٌ ومكسب لغويّ معاً.
// شرطه: ذِكر النسب (تحته) وترويسة وكيلٍ صحيحة (يُرسلها المتصفّح).
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "© مساهمو OpenStreetMap";

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  center: [number, number];
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, center, onPick }: LocationPickerMapProps) {
  const hasMarker = lat != null && lng != null;
  return (
    <MapContainer
      center={hasMarker ? [lat, lng] : center}
      zoom={hasMarker ? 15 : 12}
      scrollWheelZoom
      attributionControl
      className="maskani-map h-full w-full rounded-2xl z-0"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <ClickCapture onPick={onPick} />
      {hasMarker && <Marker position={[lat, lng]} icon={propertyIcon} />}
    </MapContainer>
  );
}
