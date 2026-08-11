// ─────────────────────────────────────────────────────────────────────────
//  ثوابت + أنواع الخريطة — خالية تماماً من Leaflet (آمنة للاستيراد في أي
//  مكوّن خادم/عميل دون كسر SSR). لا تستورد "leaflet" هنا أبداً.
// ─────────────────────────────────────────────────────────────────────────
import type { Currency, OfferType, PropertyType } from "@/types";

/** شكل نتيجة نقطة الخريطة القادمة من GET /properties/map/ */
export interface MapProperty {
  id: number;
  latitude: number;
  longitude: number;
  price: string;
  currency: Currency;
  offer_type: OfferType;
  property_type: PropertyType;
  main_image: string | null;
}

export interface MapResponse {
  count: number;
  truncated: boolean;
  results: MapProperty[];
}

/** المركز الافتراضي — صنعاء، اليمن */
export const YEMEN_CENTER: [number, number] = [15.3694, 44.191];
export const DEFAULT_ZOOM = 12;

/** مراكز المدن اليمنية الرئيسية (مفاتيح عربية + إنجليزية) */
export const CITY_COORDS: Record<string, [number, number]> = {
  "صنعاء": [15.3694, 44.191],
  sanaa: [15.3694, 44.191],
  "sana'a": [15.3694, 44.191],
  "عدن": [12.7797, 45.0095],
  aden: [12.7797, 45.0095],
  "تعز": [13.5789, 44.0219],
  taiz: [13.5789, 44.0219],
  "الحديدة": [14.7978, 42.9545],
  hodeidah: [14.7978, 42.9545],
  "al hudaydah": [14.7978, 42.9545],
  "إب": [13.9667, 44.1833],
  ibb: [13.9667, 44.1833],
  "المكلا": [14.5426, 49.1242],
  mukalla: [14.5426, 49.1242],
};

/** ابحث عن إحداثيات مدينة بالاسم العربي أو الإنجليزي، أو null إن لم تُعرف */
export function cityCoords(
  nameAr?: string | null,
  nameEn?: string | null
): [number, number] | null {
  const ar = (nameAr ?? "").trim();
  if (ar && CITY_COORDS[ar]) return CITY_COORDS[ar];
  const en = (nameEn ?? "").trim().toLowerCase();
  if (en && CITY_COORDS[en]) return CITY_COORDS[en];
  return null;
}
