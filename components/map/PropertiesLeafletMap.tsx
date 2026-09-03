"use client";
// ─────────────────────────────────────────────────────────────────────────
//  خريطة تصفّح العقارات (Leaflet + OpenStreetMap) — بدون أي مفتاح API.
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
import { priceIcon } from "./leafletSetup";
import { DEFAULT_ZOOM, type MapProperty, type MapResponse } from "./constants";

// Leaflet + MarkerCluster stylesheets (client-only import — SSR-safe here).
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export interface PropertiesLeafletMapProps {
  /**
   * نقاط النتائج الظاهرة في الشبكة — **تُلائم الخريطةُ نفسَها عليها**.
   *
   * ⚠️ بلا هذا كانت الخريطة تفتح على مركز المدينة المختارة (أو الافتراضي)
   * بينما النتائج في محافظة أخرى: شبكةٌ ملأى بجانب خريطةٍ خالية — أسوأ من عدم
   * عرض الخريطة، لأنها توحي بأن لا شيء هناك. المقاس يتبع النتيجة لا العكس.
   */
  fitPoints?: [number, number][];
  center: [number, number];
  zoom?: number;
  /** الفلاتر الحالية للصفحة (city/property_type/offer_type/price/search…) */
  filters?: Record<string, string>;
}

// ⚠️ **بلاط OpenStreetMap لا CARTO.** كان CARTO Voyager، وصار يطبع **«API KEY
// REQUIRED»** قُطرياً على كل بلاطة (مُتحقَّق بتنزيل بلاطة 2026‑08‑30) — خريطةٌ
// مشوّهة على أهمّ شاشة عندنا، والبديل المرخّص عندهم مدفوع. وبلاط OSM يكسب
// شيئاً إضافياً: أسماؤه **بالعربية** في منطقتنا (بورتسودان · البحر الأحمر)
// بينما CARTO يكتبها بالإنجليزية — فالتصحيح إصلاحٌ ومكسب لغويّ معاً.
// شرطه: ذِكر النسب (تحته) وترويسة وكيلٍ صحيحة (يُرسلها المتصفّح).
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
// إسناد الحقوق مطلوب بموجب سياسة OpenStreetMap و CARTO.
const TILE_ATTRIBUTION = "© مساهمو OpenStreetMap";

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
        const { data } = await api.get<MapResponse>("/properties/map/", { params });
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
/**
 * يُلائم العرض على نقاط النتائج مرّة واحدة لكل مجموعة.
 *
 * ⚠️ **مرّة واحدة لا في كل تصيير**: الملاءمة تُحرّك الخريطة، وتحريكها يُطلق
 * `ViewportLoader` فيجلب نتائج جديدة فتتغيّر النقاط فتُلائم من جديد — حلقةٌ لا
 * تنتهي. المفتاح النصّي يجعلها تعمل عند تغيّر **النقاط نفسها** فقط.
 */
function FitToResults({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join()).join("|");
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const key = `${center[0]},${center[1]}`;
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function PropertiesLeafletMap({ center, zoom = DEFAULT_ZOOM, filters, fitPoints = [] }: PropertiesLeafletMapProps) {
  const [markers, setMarkers] = useState<MapProperty[]>([]);
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
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        {fitPoints.length ? <FitToResults points={fitPoints} /> : <Recenter center={center} zoom={zoom} />}
        <ViewportLoader filters={filters} onData={handleData} onLoadingChange={setLoading} />

        {/* ⚠️ التجميع مفيدٌ عند مئات النقاط، ومضرٌّ عند عشرة: يُخفي أسعارها
            خلف دائرةٍ صمّاء. `disableClusteringAtZoom` يُبقيه للكثافة وحدها. */}
        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} disableClusteringAtZoom={11} maxClusterRadius={45}>
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={priceIcon(formatPrice(m.price, m.currency))}
              // ⚠️ **المعاينة تفتح بالمرور لا بالنقر**: المرجع يُظهر بطاقةً
              // كاملة (صورة وسعر وعنوان) بمجرّد المرور، فيقرأ الباحث العرض بلا
              // أن يفقد سياق الخريطة. النقر يبقى للانتقال إلى صفحة العقار.
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => setTimeout(() => e.target.closePopup(), 400),
              }}
            >
              <Popup>
                <Link href={`/properties/${m.id}`} className="block w-48 no-underline">
                  <div className="h-24 w-full overflow-hidden rounded-lg bg-muted-100">
                    {m.main_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.main_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Buildings2 className="h-8 w-8 text-muted-200" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-body font-extrabold text-primary">
                      {formatPrice(m.price, m.currency)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-micro">
                      <span className="rounded-full bg-muted-100 px-2 py-0.5 text-muted-600">
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
                    <span className="mt-2 flex items-center gap-1 text-micro font-semibold text-primary">
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
          <span className="pointer-events-auto rounded-full bg-gold px-4 py-1.5 text-caption font-bold text-white shadow-lg">
            قرّب للتصفية — النتائج كثيرة
          </span>
        </div>
      )}

      {/* مؤشّر التحميل */}
      {loading && (
        <div className="absolute right-3 top-3 z-[1000] rounded-full bg-white/90 px-3 py-1 text-caption font-semibold text-primary shadow">
          جاري التحميل…
        </div>
      )}
    </div>
  );
}
