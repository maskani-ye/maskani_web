"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة تصفّح الإعلانات (Leaflet + OpenStreetMap) — بدون أي مفتاح API.
//
//  ⚠️  للتبديل إلى Google Maps JS مستقبلاً: أعد كتابة هذا الملف فقط بنفس الـ
//      props (center, zoom, filters). لا شيء من Leaflet يتسرّب خارج
//      مجلد components/map/.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels, propertyTypeName } from "@/lib/utils";
import { Buildings2, MapPoint } from "@solar-icons/react";
import { listingIcon } from "./leafletSetup";
import { DEFAULT_ZOOM, type MapListing, type MapResponse } from "./constants";

// Leaflet + MarkerCluster stylesheets (client-only import — SSR-safe here).
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export interface ListingsLeafletMapProps {
  center: [number, number];
  zoom?: number;
  /** الفلاتر الحالية للصفحة (city/property_type/offer_type/price/search…) */
  filters?: Record<string, string>;
}

// بلاط CARTO Voyager — أقرب مظهر مجاني لخرائط Google (مطابق لتطبيق Flutter).
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_SUBDOMAINS = "abcd";
// إسناد الحقوق مطلوب بموجب سياسة OpenStreetMap و CARTO.
const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

/** يحوّل حدود الخريطة إلى bbox = minLng,minLat,maxLng,maxLat (west,south,east,north) */
function boundsToBbox(map: LeafletMap): string {
  const b = map.getBounds();
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  return [sw.lng, sw.lat, ne.lng, ne.lat].map((n) => n.toFixed(6)).join(",");
}

/**
 * يستمع لحركة الخريطة (moveend/zoomend) + التحميل الأولي، ويجلب النقاط ضمن
 * الإطار المرئي بعد debounce ~400ms. يمرّر الفلاتر الحالية مع الـ bbox.
 */
function ViewportLoader({
  filters,
  onData,
  onLoadingChange,
}: {
  filters?: Record<string, string>;
  onData: (r: MapResponse) => void;
  onLoadingChange: (v: boolean) => void;
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // مُعرّف الطلب — يمنع استجابة قديمة (bbox سابق) من الكتابة فوق أحدث نتيجة.
  const reqIdRef = useRef(0);
  const filtersKey = JSON.stringify(filters ?? {});

  const map = useMapEvents({
    moveend: () => schedule(map),
    zoomend: () => schedule(map),
  });

  const fetchNow = useCallback(
    async (m: LeafletMap) => {
      const myId = ++reqIdRef.current;
      onLoadingChange(true);
      try {
        const params: Record<string, string> = { bbox: boundsToBbox(m) };
        Object.entries(filters ?? {}).forEach(([k, v]) => {
          if (v) params[k] = v;
        });
        const { data } = await api.get<MapResponse>("/listings/map/", { params });
        if (myId === reqIdRef.current) onData(data);
      } catch {
        if (myId === reqIdRef.current) onData({ count: 0, truncated: false, results: [] });
      } finally {
        if (myId === reqIdRef.current) onLoadingChange(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey, onData, onLoadingChange]
  );

  const schedule = useCallback(
    (m: LeafletMap) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchNow(m), 400);
    },
    [fetchNow]
  );

  // تحميل أولي + إعادة الجلب عند تغيّر الفلاتر
  useEffect(() => {
    fetchNow(map);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return null;
}

/** يعيد توسيط الخريطة عند تغيّر الـ center (مثلاً عند اختيار مدينة) */
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const key = `${center[0]},${center[1]}`;
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function ListingsLeafletMap({ center, zoom = DEFAULT_ZOOM, filters }: ListingsLeafletMapProps) {
  const [markers, setMarkers] = useState<MapListing[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleData = useCallback((r: MapResponse) => {
    setMarkers(r.results ?? []);
    setTruncated(Boolean(r.truncated));
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="maskani-map h-full w-full rounded-2xl z-0"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains={TILE_SUBDOMAINS} maxZoom={20} />
        <Recenter center={center} zoom={zoom} />
        <ViewportLoader filters={filters} onData={handleData} onLoadingChange={setLoading} />

        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
          {markers.map((m) => (
            <Marker key={m.id} position={[m.latitude, m.longitude]} icon={listingIcon}>
              <Popup>
                <Link href={`/listings/${m.id}`} className="block w-48 no-underline">
                  <div className="h-24 w-full overflow-hidden rounded-lg bg-gray-100">
                    {m.main_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.main_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Buildings2 className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-extrabold text-primary">
                      {formatPrice(m.price, m.currency)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        {propertyTypeName(m.property_type)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold text-white ${
                          m.offer_type === "sale" ? "bg-primary" : "bg-gold"
                        }`}
                      >
                        {offerTypeLabels[m.offer_type]}
                      </span>
                    </div>
                    <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <MapPoint className="h-3.5 w-3.5" /> عرض التفاصيل
                    </span>
                  </div>
                </Link>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* تلميح: قرّب للتصفية عند اقتطاع النتائج */}
      {truncated && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center">
          <span className="pointer-events-auto rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            قرّب للتصفية — النتائج كثيرة
          </span>
        </div>
      )}

      {/* مؤشّر التحميل */}
      {loading && (
        <div className="absolute right-3 top-3 z-[1000] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow">
          جاري التحميل…
        </div>
      )}
    </div>
  );
}
