"use client";

/**
 * شريط الثقة — بديل قسم «مسكني بالأرقام».
 *
 * ⚠️ القسم السابق كان يعرض حرفياً: «9 عقار · 2 مزوّد خدمة · 1 طلب خدمة ·
 * 319 محافظة · 31,468 زيارة». الرقم ليس دليلاً اجتماعياً إلا إذا كان مُبهراً؛
 * و«9 عقارات» بجانب «31 ألف زيارة» يقول للزائر بالضبط: واحدٌ وثلاثون ألفاً
 * زاروا ولم ينشر أحد. و«319 محافظة مقابل 9 عقارات» نسبةٌ تفضح الفراغ.
 * (زيلو يقول «135 مليون منزل» — الرقم يُعرض حين يخدم، لا لأنه متاح.)
 *
 * البديل ليس رقماً أصغر بل **نوعاً آخر من الإثبات**: ما تضمنه المنصّة للزائر
 * الآن، وهو صحيحٌ من أوّل يوم ولا يتحسّن بالمخزون. وميزة مسكني الفريدة —
 * مجتمع كشف الاحتيال — تنتقل إلى هنا بصياغة إيجابية بدل «هل تعرّضت لاحتيال؟»
 * في قاع الصفحة.
 */
import Link from "next/link";
import {
  ShieldCheck, Wallet, ChatRound, ShieldWarning,
} from "@solar-icons/react";

const SIGNALS = [
  {
    Icon: Wallet,
    title: "بلا عمولة",
    body: "تتواصل مع من نشر العقار مباشرةً على رقمه. لا نسبة من الصفقة ولا رسوم.",
  },
  {
    Icon: ShieldCheck,
    title: "ملّاك موثّقون",
    body: "توثيق الهوية اختياريّ ومعروض على الإعلان، مع إشارات ثقة كعمر الحساب وتكرار الرقم.",
  },
  {
    Icon: ShieldWarning,
    title: "مجتمع يكشف الاحتيال",
    body: "بلاغات يشاركها المستخدمون ويصوّتون عليها — تعرف المحتال قبل أن تدفع.",
    href: "/reports",
    cta: "تصفّح البلاغات",
  },
  {
    Icon: ChatRound,
    title: "تفاوض داخل المنصّة",
    body: "محادثة فورية مع الطرف الآخر، وسجلٌّ يبقى عندك — لا أرقام تضيع في الواتساب.",
  },
];

export function TrustStrip() {
  return (
    <section aria-labelledby="trust-heading">
      {/* محاذاة البداية لا التوسيط: الصفحة كلّها تبدأ من الحافة نفسها، والتوسيط
          هنا كان يكسر الخطّ العموديّ الذي تسير عليه بقيّة العناوين. */}
      <div className="mb-8">
        <h2 id="trust-heading" className="text-h1 text-ink">لماذا مسكني؟</h2>
        <p className="text-body text-muted mt-2">
          منصّة تربطك بصاحب العقار مباشرةً — وتحميك في الطريق
        </p>
      </div>

      {/* ⚠️ **عمودٌ واحد على الجوال كان يمدّ القسم إلى ألف بكسل** — خُمس
          الصفحة لأربع بطاقاتٍ نصّها سطران. البطاقة تحتمل عمودين على 390 بكسل
          (أيقونة 44 + نصّ قصير)، فالتقسيم يوفّر نصف الارتفاع بلا حذف كلمة. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {SIGNALS.map(({ Icon, title, body, href, cta }) => (
          <div
            key={title}
            className="bg-white rounded-2xl p-4 sm:p-6 ring-1 ring-ink/[0.06] flex flex-col"
          >
            <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-3 sm:mb-4">
              <Icon weight="Bold" className="h-5 w-5" />
            </span>
            <h3 className="text-h3 text-ink">{title}</h3>
            <p className="text-caption text-muted mt-1.5 leading-relaxed flex-1">
              {body}
            </p>
            {href && cta && (
              <Link
                href={href}
                className="text-caption font-bold text-primary mt-3 hover:underline self-start"
              >
                {cta} ←
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
