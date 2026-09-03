import Link from "next/link";
import Image from "next/image";
import { formatPrice, offerTypeLabels, propertyTypeName } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Item {
  id: number;
  title: string;
  property_type: unknown;
  offer_type: string;
  city_name?: string;
  price: string | null;
  currency: string | null;
  main_image: string | null;
}

// خادمي — سبب وجوده فهرسيّ لا تجميليّ: القائمة التفاعلية في `/properties` تستخدم
// `useSearchParams` فتُصيَّر في المتصفّح، فيرى زاحف جوجل «جارِ التحميل…» ولا عقاراً
// واحداً — ولهذا صنّف الصفحة «مُكتشَفة، غير مفهرسة» في Search Console. هذه الكتلة
// تضع أحدث العقارات كروابط <a> حقيقية في HTML الخام: محتوى فريد للصفحة + مسار
// زحف إلى صفحات العقارات العميقة.
async function getLatest(): Promise<Item[]> {
  try {
    const res = await fetch(`${API}/properties/?limit=12&offset=0`, {
      next: { revalidate: 600 }, // عشر دقائق — طازج بما يكفي، وبلا إرهاق للقاعدة
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []) as Item[];
  } catch {
    return [];
  }
}

export default async function LatestProperties() {
  const items = await getLatest();
  if (!items.length) return null;

  return (
    <section aria-labelledby="latest-heading" className="max-w-7xl mx-auto px-4 mt-4 mb-8">
      <h2 id="latest-heading" className="text-h3 font-bold text-ink mb-4">
        أحدث العقارات المعروضة
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((p) => {
          const isSale = p.offer_type === "sale";
          return (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="bg-white rounded-2xl p-2.5 shadow-e2 hover:shadow-e3 transition-all duration-200 group flex flex-col"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted-100">
                {p.main_image ? (
                  <Image
                    src={p.main_image}
                    alt={`${p.title} — ${propertyTypeName(p.property_type)}${p.city_name ? " في " + p.city_name : ""}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary text-white/70 text-caption">
                    مسكني
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur shadow-sm ${
                    isSale ? "bg-primary/95 text-white" : "bg-gold/95 text-ink"
                  }`}
                >
                  {offerTypeLabels[p.offer_type] ?? p.offer_type}
                </span>
              </div>
              <div className="px-1 pt-2.5 pb-1 flex flex-col flex-1">
                <span className="text-[11px] font-bold text-primary mb-1">
                  {propertyTypeName(p.property_type)}
                </span>
                <h3 className="font-bold text-ink text-body mb-1 line-clamp-1">{p.title}</h3>
                {p.city_name && (
                  <span className="text-muted text-caption line-clamp-1 mb-1.5">{p.city_name}</span>
                )}
                <span className="mt-auto font-extrabold text-ink text-body">
                  {formatPrice(p.price, p.currency)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
