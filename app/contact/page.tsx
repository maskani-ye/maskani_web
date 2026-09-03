import type { Metadata } from "next";
import Link from "next/link";
import { ChatRound, Phone, ShieldWarning, Letter } from "@solar-icons/react";

export const metadata: Metadata = {
  title: "تواصل معنا — مسكني",
  description:
    "قنوات التواصل مع فريق مسكني: مركز المساعدة، والإبلاغ عن محتوى مخالف، وطلبات إزالة الإعلانات، والاستفسارات العامة.",
  alternates: { canonical: "/contact" },
};

export const revalidate = 3600;

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.maskani.homes/api/v1";

/**
 * رقم التواصل العامّ يُدار من لوحة الإدارة (`SiteConfig.general_phone`).
 *
 * ⚠️ لا نكتب رقماً أو بريداً في الشيفرة: بيانات تواصل مختلقة أسوأ من غيابها —
 * تُفقد الثقة وتُفشل مراجعة الناشرين. حين يُضبط الرقم من اللوحة يظهر تلقائياً.
 */
async function getPhone(): Promise<string> {
  try {
    const res = await fetch(`${API}/settings/app-config/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.general_phone || "").trim();
  } catch {
    return "";
  }
}

export default async function ContactPage() {
  const phone = await getPhone();
  const digits = phone.replace(/\D/g, "");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header>
        <h1 className="text-h2 sm:text-h1 font-extrabold text-ink mb-3">تواصل معنا</h1>
        <p className="text-muted-600 leading-relaxed">
          نقرأ كل رسالة. اختر القناة المناسبة لطلبك فيصل إلى الجهة الصحيحة أسرع.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/help"
          className="rounded-2xl border border-muted-100 bg-white p-5 hover:border-primary transition-colors"
        >
          <ChatRound className="h-6 w-6 text-primary mb-2" />
          <h2 className="font-bold text-ink mb-1">مركز المساعدة</h2>
          <p className="text-body text-muted-500 leading-relaxed">
            القناة الأسرع: أسئلة شائعة بأجوبة جاهزة، وإن لم تجد جوابك تفتح تذكرة
            يردّ عليها الفريق.
          </p>
        </Link>

        <Link
          href="/reports/create"
          className="rounded-2xl border border-muted-100 bg-white p-5 hover:border-primary transition-colors"
        >
          <ShieldWarning className="h-6 w-6 text-primary mb-2" />
          <h2 className="font-bold text-ink mb-1">الإبلاغ عن احتيال</h2>
          <p className="text-body text-muted-500 leading-relaxed">
            إعلان وهميّ أو محاولة نصب؟ البلاغ يظهر للجميع ويصوّت عليه المستخدمون،
            ويراجعه فريقنا.
          </p>
        </Link>

        {phone ? (
          <a
            href={`tel:${phone}`}
            className="rounded-2xl border border-muted-100 bg-white p-5 hover:border-primary transition-colors"
          >
            <Phone className="h-6 w-6 text-primary mb-2" />
            <h2 className="font-bold text-ink mb-1">هاتف الفريق</h2>
            <p className="text-body text-muted-500" dir="ltr">{phone}</p>
            {digits && (
              <p className="text-caption text-muted mt-1">
                متاح أيضاً على واتساب على الرقم نفسه.
              </p>
            )}
          </a>
        ) : null}

        <Link
          href="/help"
          className="rounded-2xl border border-muted-100 bg-white p-5 hover:border-primary transition-colors"
        >
          <Letter className="h-6 w-6 text-primary mb-2" />
          <h2 className="font-bold text-ink mb-1">إزالة محتوى أو حقوق</h2>
          <p className="text-body text-muted-500 leading-relaxed">
            طلبات إزالة إعلان أو صورة أو بيانات شخصية: افتح تذكرة واذكر رابط
            الصفحة وسبب الطلب.
          </p>
        </Link>
      </div>

      <section className="rounded-2xl bg-cream border border-muted-100 p-5 space-y-2">
        <h2 className="font-bold text-ink">قبل أن تراسلنا</h2>
        <p className="text-body text-muted-600 leading-relaxed">
          مسكني منصّة تواصل مباشر بين الملّاك والباحثين — <strong>لا نبيع ولا
          نشتري ولا نتوسّط</strong>، ولا نتلقّى أي مدفوعات. أسعار العقارات
          وتفاصيلها من نشر أصحابها، والتعاقد يقع بينكم مباشرةً. اقرأ{" "}
          <Link href="/terms" className="text-primary hover:underline">شروط الاستخدام</Link>{" "}
          و<Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>،
          وتعرّف علينا في <Link href="/about" className="text-primary hover:underline">من نحن</Link>.
        </p>
      </section>
    </div>
  );
}
