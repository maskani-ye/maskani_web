"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة تفاعلية لاختيار موقع العقار — اضغط على الخريطة لوضع العلامة.
//  مطابقة لشاشة اختيار الموقع في تطبيق Flutter (نفس بلاط CARTO Voyager).
//  كل تبعية Leaflet محبوسة داخل components/map/ فقط.
// ─────────────────────────────────────────────────────────────────────────
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { listingIcon } from "./leafletSetup";

import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_SUBDOMAINS = "abcd";
const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

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
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains={TILE_SUBDOMAINS} maxZoom={20} />
      <ClickCapture onPick={onPick} />
      {hasMarker && <Marker position={[lat, lng]} icon={listingIcon} />}
    </MapContainer>
  );
}
