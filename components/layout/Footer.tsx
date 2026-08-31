"use client";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  التذييل — أُعيد بناؤه من الصفر
 * ════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **حذفتُ ادّعاءً كاذباً كان يظهر في كل صفحة**: «آلاف العقارات» ونحن نعرض
 * **أحد عشر**. رقمٌ يكذّبه الزائر في نقرة واحدة يُسقط الثقة في كل ما حوله —
 * وكان في التذييل الظاهر على كل شاشة. ومعه «منصّة موثوقة وآمنة»: ادّعاءٌ بلا
 * دليل يقوله كل موقع، فلا يقول شيئاً. البديل **أرقام حيّة** من القاعدة.
 *
 * ⚠️ **وعمود «التواصل» لم يكن فيه وسيلة تواصل واحدة** — عنوانٌ يعِد بما لا
 * يحويه. الآن فيه واتساب حقيقيّ من إعدادات المنصّة، ورابط الاتصال، والمكاتب.
 *
 * ⚠️ **والأسواق تُقرأ من السياق لا من قائمة مكتوبة**: `CountryProvider` محمّل
 * أصلاً في كل صفحة، فسردها هنا بلا نداء إضافي — وفتح سوق سابع يظهر تلقائياً.
 *
 * التخطيط: صفٌّ عريض للعلامة والأعمدة الأربعة، ثم شريطٌ سفليّ للحقوق والروابط
 * القانونية. بعرض الشاشة كالشريط العلوي كي تتحاذى الحوافّ.
 */

import Link from "@/components/nav/MarketLink";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import {
  Home2, Buildings2, Settings, ClipboardList, CaseMinimalistic,
  Phone, Letter, Global, AltArrowLeft,
} from "@solar-icons/react";
import { StoreBadges } from "@/components/download/StoreBadges";
import { useCountry } from "@/context/CountryContext";
import { api } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatNumber } from "@/lib/utils";
import { marketPath } from "@/lib/markets";

const BROWSE = [
  { href: "/properties", label: "العقارات", Icon: Buildings2 },
  { href: "/services", label: "الخدمات", Icon: Settings },
  { href: "/requests", label: "طلبات العقارات", Icon: ClipboardList },
  { href: "/jobs", label: "طلبات الخدمات", Icon: CaseMinimalistic },
];

const PLATFORM = [
  { href: "/blog", label: "المدونة" },
  { href: "/tools", label: "أدوات وحاسبات" },
  { href: "/help", label: "مركز المساعدة" },
  { href: "/reports", label: "مجتمع الشكاوى" },
  { href: "/about", label: "من نحن" },
];

const LEGAL = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Footer() {
  const { countries } = useCountry();
  const [phone, setPhone] = useState("");

  // رقم التواصل من إعدادات المنصّة — يُدار من اللوحة، ولا يُكتب في الشيفرة.
  useEffect(() => {
    api
      .get<{ general_phone?: string }>(ep.appConfig)
      .then((r) => setPhone((r.data.general_phone || "").trim()))
      .catch(() => setPhone(""));
  }, []);

  const wa = phone.replace(/\D/g, "");

  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        {/* ─── الصفّ العريض ─────────────────────────────────────────────── */}
        {/* ⚠️ **«تواصل معنا» عمودٌ مستقلّ**: كان ملحقاً تحت عمود الأسواق، فبدا
            تابعاً لها لا قسماً قائماً — والزائر الذي يبحث عن وسيلة تواصل يمسح
            رؤوس الأعمدة، فلا يجد عنواناً يدلّه. خمسة أعمدة على الشاشة الواسعة،
            وتنطوي إلى صفوف على الأضيق. */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
          {/* العلامة */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Home2 weight="Bold" className="h-5 w-5" />
              </span>
              <span className="text-h2 font-extrabold">مسكني</span>
            </div>
            <p className="mt-4 max-w-sm text-caption leading-relaxed text-white/60">
              منصّة عقارية تصلك بصاحب العقار مباشرةً: عقارات وخدمات وطلبات، بلا
              عمولة وبلا بوّابة دفع.
            </p>

            <Link
              href="/properties/create"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-caption font-bold text-ink transition-colors hover:bg-gold/90"
            >
              أضف عقارك مجّاناً
              <AltArrowLeft className="h-4 w-4" />
            </Link>

            <div className="mt-6">
              <p className="mb-2.5 text-caption font-bold text-white/80">حمّل التطبيق</p>
              <StoreBadges />
            </div>
          </div>

          {/* تصفّح */}
          <nav aria-label="تصفّح الأقسام">
            <h2 className="text-caption font-bold text-white">تصفّح</h2>
            <ul className="mt-4 space-y-2.5">
              {BROWSE.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-caption text-white/60 transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-white/35 transition-colors group-hover:text-gold" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* المنصّة */}
          <nav aria-label="روابط المنصّة">
            <h2 className="text-caption font-bold text-white">المنصّة</h2>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM.map(({ href, label }) => (
                <li key={href}>
                  <NextLink href={href} className="text-caption text-white/60 transition-colors hover:text-white">
                    {label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* الأسواق */}
          <nav aria-label="الأسواق">
              <h2 className="flex items-center gap-2 text-caption font-bold text-white">
                <Global className="h-4 w-4 text-gold" /> الأسواق
              </h2>
              <ul className="mt-4 space-y-2.5">
                {countries.map((c) => (
                  <li key={c.id}>
                    <NextLink
                      href={marketPath(c.code.toLowerCase())}
                      className="group inline-flex items-center gap-2 text-caption text-white/60 transition-colors hover:text-white"
                    >
                      <span aria-hidden>{c.flag_emoji}</span>
                      {c.name_ar}
                      {/* ⚠️ رقمٌ حيّ من القاعدة — لا «آلاف العقارات» التي كانت
                          هنا ونحن نعرض أحد عشر. السوق الفارغ يُقال إنه جديد. */}
                      <span className="text-white/30">
                        {c.properties_count ? `· ${formatNumber(c.properties_count)}` : "· جديد"}
                      </span>
                    </NextLink>
                  </li>
                ))}
            </ul>
          </nav>

          {/* تواصل معنا — عمود قائم بذاته */}
          <div>
            <h2 className="text-caption font-bold text-white">تواصل معنا</h2>
            <ul className="mt-4 space-y-2.5">
              {wa && (
                <li>
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-caption text-white/60 transition-colors hover:text-white"
                  >
                    <Phone className="h-4 w-4 text-white/35 transition-colors group-hover:text-gold" />
                    واتساب
                  </a>
                </li>
              )}
              <li>
                <NextLink href="/contact" className="group inline-flex items-center gap-2 text-caption text-white/60 transition-colors hover:text-white">
                  <Letter className="h-4 w-4 text-white/35 transition-colors group-hover:text-gold" />
                  نموذج المراسلة
                </NextLink>
              </li>
              <li>
                <NextLink href="/offices" className="text-caption font-semibold text-gold transition-colors hover:text-gold/80">
                  للمكاتب العقارية والدلّالين ←
                </NextLink>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── الشريط السفليّ ───────────────────────────────────────────── */}
        {/* ⚠️ **حشوٌ سفليّ يتجاوز الزرّ العائم**: زرّ «المساعدة» ثابتٌ في زاوية
            الشاشة، فكان يغطّي طرف هذا الشريط ويبتر آخر سطر فيه. الحشو يفتح
            المساحة تحته بدل أن نُزيح الزرّ — الزرّ يجب أن يبقى في متناول اليد. */}
        <div className="flex flex-col gap-3 border-t border-white/10 pb-24 pt-6 sm:flex-row sm:items-center sm:justify-between lg:pb-6">
          <p className="text-caption text-white/45">
            © {formatNumber(new Date().getFullYear())} مسكني — جميع الحقوق محفوظة
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL.map(({ href, label }) => (
              <NextLink key={href} href={href} className="text-caption text-white/45 transition-colors hover:text-white">
                {label}
              </NextLink>
            ))}
          </div>
          {/* ⚠️ عبارةٌ **قابلة للتحقّق**: لا بوّابة دفع في المنصّة إطلاقاً — وهي
              أنفع للزائر من «منصّة موثوقة وآمنة» التي كانت هنا ولا تقول شيئاً. */}
          <p className="text-caption text-white/30 lg:pe-28">
            لا مدفوعات داخل المنصّة — التواصل مباشر بين الطرفين
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
