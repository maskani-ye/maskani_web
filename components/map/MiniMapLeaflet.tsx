"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة مصغّرة غير تفاعلية بعلامة واحدة (لصفحة تفاصيل الإعلان).
//
//  ⚠️  للتبديل إلى Google Maps JS مستقبلاً: أعد كتابة هذا الملف فقط بنفس الـ
//      props. لا شيء من Leaflet يتسرّب خارج مجلد components/map/.
// ─────────────────────────────────────────────────────────────────────────
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { listingIcon } from "./leafletSetup";

import "leaflet/dist/leaflet.css";

export interface MiniMapLeafletProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
      <TileLayer url={OSM_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <Marker position={[lat, lng]} icon={listingIcon} />
    </MapContainer>
  );
}
