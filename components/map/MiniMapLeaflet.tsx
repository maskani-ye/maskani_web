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

// بلاط CARTO Voyager — أقرب مظهر مجاني لخرائط Google (مطابق لتطبيق Flutter).
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_SUBDOMAINS = "abcd";
const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

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
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains={TILE_SUBDOMAINS} maxZoom={20} />
      <Marker position={[lat, lng]} icon={propertyIcon} />
    </MapContainer>
  );
}
