import Link from "next/link";
import { COUNTRIES, GLOBAL_UNITS, unitsOfCountry } from "@/lib/areaUnits";

// روابط خادميّة لكل صفحات الوحدات — مسار زحف يوصل جوجل إلى كل وحدة على حدة،
// وطريقٌ للقارئ الذي يعرف اسم وحدته ولا يريد تشغيل حاسبة.
export default function UnitLinks() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h2 className="text-base font-bold text-ink mb-1">كم متر مربّع في…؟ صفحة لكل وحدة</h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        لكل وحدة صفحتها بقيمتها وجدول تحويلها الجاهز — بما فيها اشتقاقات الاسم الواحد
        (القصبة العشاري والهدوي والإبي، واللبنة الصنعاني والذماري والعمراني والصعدي).
      </p>
      <div className="space-y-4">
        {COUNTRIES.map((c) => {
          const units = unitsOfCountry(c.code);
          if (!units.length) return null;
          return (
            <div key={c.code}>
              <p className="text-xs font-bold text-gray-600 mb-1.5">{c.flag} {c.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {units.map((u) => (
                  <Link key={u.key} href={`/tools/area-converter/${u.slug}`}
                    className="text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                    {u.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">🌍 وحدات معياريّة</p>
          <div className="flex flex-wrap gap-1.5">
            {GLOBAL_UNITS.map((u) => (
              <Link key={u.key} href={`/tools/area-converter/${u.slug}`}
                className="text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                {u.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
