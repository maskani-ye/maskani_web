// ─────────────────────────────────────────────────────────────────────────
//  أيقونة Leaflet المخصّصة — يستورد "leaflet" (يحتاج window)، لذا يُستورَد
//  فقط من مكوّنات العميل المحمّلة عبر next/dynamic ssr:false. لا تستورد هذا
//  الملف من أي مكوّن خادم/صفحة مباشرة (سيكسر SSR). للثوابت الخالية من
//  Leaflet استخدم ./constants بدلاً منه.
//
//  ⚠️  للتبديل إلى Google Maps JS مستقبلاً: أعد كتابة مكوّنات components/map/
//      فقط. لا شيء من Leaflet يتسرّب خارج هذا المجلد.
// ─────────────────────────────────────────────────────────────────────────
import L from "leaflet";

// ─── إصلاح مشكلة أيقونة Leaflet الافتراضية المكسورة تحت الـ bundlers ───────
//  نستخدم divIcon مخصّصة بألوان العلامة التجارية، فلا نعتمد أبداً على مسارات
//  الصور الافتراضية (marker-icon.png) التي تنكسر مع webpack/turbopack.
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42" fill="none">
  <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="#4F2396"/>
  <circle cx="15" cy="15" r="6" fill="#FFC107"/>
</svg>`;

/** أيقونة العقار (نقطة واحدة) بألوان مسكني */
export const propertyIcon: L.DivIcon = L.divIcon({
  className: "maskani-marker",
  html: PIN_SVG,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -40],
});
