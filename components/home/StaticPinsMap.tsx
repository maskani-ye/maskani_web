"use client";

/**
 * خريطة عرضٍ فقط بدبابيس حقيقية — تُستعمل داخل [HomeMapPreview].
 *
 * كل تفاعل مُعطَّل (سحب/تقريب/عجلة/نقر مزدوج): البطاقة كلّها رابط، ولا يجوز أن
 * يبتلع سحبُ الخريطة تمريرَ الصفحة على الجوّال.
 *
 * ⚠️ لا شيء من Leaflet يتسرّب خارج هذا الملف — نفس عقد بقيّة مكوّنات الخريطة،
 * فالتبديل إلى مزوّد آخر مستقبلاً يمسّ هذا الملف وحده.
 */
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

import "leaflet/dist/leaflet.css";

const TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";  // CARTO صار يطبع «API KEY REQUIRED»
const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

export default function StaticPinsMap({
  points,
}: {
  points: Array<[number, number]>;
}) {
  // نُؤطّر كل النقاط بدل تثبيت مركز: سوقٌ في القاهرة وآخر في صنعاء لا يشتركان
  // في مركز واحد، وأي مركز ثابت يعني خريطةً فارغة لأحدهما.
  const bounds = useMemo<LatLngBoundsExpression | undefined>(() => {
    if (points.length === 0) return undefined;
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [points]);

  if (!bounds) return <div className="h-full w-full bg-primary-50" />;

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [40, 40], maxZoom: 13 }}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full z-0 pointer-events-none"
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        maxZoom={19}
      />
      {points.map(([lat, lng], i) => (
        <CircleMarker
          key={`${lat}-${lng}-${i}`}
          center={[lat, lng]}
          radius={6}
          pathOptions={{
            color: "#FFFFFF",
            weight: 2,
            fillColor: "#403B9B",
            fillOpacity: 1,
          }}
        />
      ))}
    </MapContainer>
  );
}
