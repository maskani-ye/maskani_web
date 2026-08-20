import Link from "next/link";
import { Home2, Shield, Buildings2 } from "@solar-icons/react";
import { StoreBadges } from "@/components/download/StoreBadges";

// روابط صفحات هبوط المحافظات — تظهر في فوتر كل صفحة (ربط داخلي سيتوايد يمرّر
// قوّة الزحف لصفحات المدن «المُكتشَفة وغير المفهرَسة» ويقلّل عمق النقر إليها).
// روابط صفحات هبوط الدول — الفوتر يُصيَّر على الخادم في كل صفحة، فإبقاء
// القائمة ثابتة هنا يتجنّب طلب شبكة في كل تصيير. تُحدَّث يدوياً عند فتح سوق
// جديد (حدثٌ نادر ومقصود لا بيانات متغيّرة).
const COUNTRIES = [{ slug: "yemen", name: "اليمن", flag: "🇾🇪" }];

const GOVERNORATES = [
  { slug: "sanaa", name: "صنعاء" }, { slug: "aden", name: "عدن" },
  { slug: "taiz", name: "تعز" }, { slug: "al-hudaydah", name: "الحديدة" },
  { slug: "ibb", name: "إب" }, { slug: "hadramout", name: "حضرموت" },
  { slug: "dhamar", name: "ذمار" }, { slug: "hajjah", name: "حجة" },
  { slug: "amran", name: "عمران" }, { slug: "marib", name: "مأرب" },
  { slug: "al-bayda", name: "البيضاء" }, { slug: "lahij", name: "لحج" },
  { slug: "abyan", name: "أبين" }, { slug: "saada", name: "صعدة" },
  { slug: "shabwah", name: "شبوة" }, { slug: "raymah", name: "ريمة" },
  { slug: "al-mahwit", name: "المحويت" }, { slug: "al-dhale-e", name: "الضالع" },
  { slug: "al-jawf", name: "الجوف" }, { slug: "al-mahrah", name: "المهرة" },
  { slug: "socotra", name: "سقطرى" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Home2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold">مسكني</span>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed">
              منصة عقارية اجتماعية تربط بين صاحب العقار والعميل. بيع، إيجار، خدمات، ومجتمع لمكافحة الاحتيال.
            </p>
            <div className="mt-5">
              <p className="text-white font-bold text-sm mb-2.5">حمّل التطبيق</p>
              <StoreBadges />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">الخدمات</h4>
            <ul className="space-y-2">
              {[
                { href: "/properties?offer_type=sale", label: "عقارات للبيع" },
                { href: "/properties?offer_type=rent_monthly", label: "إيجار شهري" },
                { href: "/properties?offer_type=rent_yearly", label: "إيجار سنوي" },
                { href: "/properties?property_type=land", label: "أراضي" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary-200 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">المنصة</h4>
            <ul className="space-y-2">
              {[
                { href: "/services", label: "خدمات عقارية" },
                { href: "/reports", label: "مجتمع الشكاوي" },
                { href: "/requests", label: "طلبات عقارية" },
                { href: "/blog", label: "المدونة" },
                { href: "/tools", label: "أدوات وحاسبات" },
                { href: "/help", label: "مركز المساعدة" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary-200 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">التواصل</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-200 text-sm">
                <Shield className="h-4 w-4 text-gold" />
                <span>منصة موثوقة وآمنة</span>
              </li>
              <li className="flex items-center gap-2 text-primary-200 text-sm">
                <Buildings2 className="h-4 w-4 text-gold" />
                <span>آلاف العقارات</span>
              </li>
            </ul>
          </div>
        </div>

        {/* تصفّح حسب الدولة — أعلى طبقة جغرافية؛ رابط دائم في كل صفحة يجعل
            صفحة هبوط الدولة على عمق نقرة واحدة من أي مكان في الموقع. */}
        <nav aria-label="تصفّح العقارات حسب الدولة" className="border-t border-primary-600 mt-8 pt-6">
          <h4 className="font-bold text-white mb-3 text-sm">تصفّح العقارات حسب الدولة</h4>
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {COUNTRIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/properties/country/${c.slug}`}
                  className="text-primary-200 hover:text-white text-sm transition-colors"
                >
                  {c.flag} عقارات {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* تصفّح حسب المحافظة — ربط داخلي سيتوايد لصفحات هبوط المدن */}
        <nav aria-label="تصفّح العقارات حسب المحافظة" className="border-t border-primary-600 mt-8 pt-6">
          <h4 className="font-bold text-white mb-3 text-sm">تصفّح العقارات حسب المحافظة</h4>
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {GOVERNORATES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/properties/city/${g.slug}`}
                  className="text-primary-200 hover:text-white text-sm transition-colors"
                >
                  عقارات {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-primary-600 mt-6 pt-6 flex flex-col gap-4">
          {/* دعوة النشر — الفوتر يظهر في كل صفحة، فهو آخر فرصة للطلب. */}
          <div className="mb-6">
            <Link
              href="/properties/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-ink hover:bg-gold/90 transition-colors"
            >
              أضف عقارك مجاناً
            </Link>
          </div>

          {/* روابط قانونية */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/privacy"
              className="text-primary-200 hover:text-white text-sm font-medium transition-colors"
            >
              سياسة الخصوصية
            </Link>
            <span className="text-primary-600" aria-hidden>
              ·
            </span>
            <Link
              href="/terms"
              className="text-primary-200 hover:text-white text-sm font-medium transition-colors"
            >
              شروط الاستخدام
            </Link>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-primary-200 text-sm">
              © {new Date().getFullYear()} مسكني — جميع الحقوق محفوظة
            </p>
            <p className="text-primary-300 text-xs">
              لا توجد عمليات دفع إلكترونية — التواصل مباشر بين الأطراف
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
